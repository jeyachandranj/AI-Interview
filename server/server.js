const express = require("express");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { createServer } = require("http");
const Chatbot = require("./chatEngine.js");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const AWS = require("aws-sdk");

dotenv.config();

const Groq = require("groq-sdk");

const app = express();

app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const chatbot = new Chatbot("public" === "public");

app.use(express.static("dist"));

io.on("connection", (socket) => {
  console.log(`CONNECTED ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`DISCONNECTED ${socket.id}: ${reason}`);
  });

  socket.on("init", async ({ settings, round, name, filename }) => {
    try {
      console.log(filename+ "*");
      await chatbot.initialize(settings, round, name, filename, socket.id);
      socket.emit("responseInit", true);
      console.log(`INITIALIZED ${socket.id}`);
    } catch (err) {
      console.error(err);
      socket.emit("responseInit", false);
      console.log(`INIT FAILED ${socket.id}`);
    }
  });

  socket.on("message", async (data) => {
    try {
      console.log("Received data:", data);

      if (!data || typeof data.question !== "string") {
        throw new TypeError("The 'question' property must be a string.");
      }

      const response = await chatbot.chat(
        data.question,
        data.duration,
        data.interviewStartTime,
        data.name,
        data.uuid
      );
      const speechData = await chatbot.textToSpeech(response);

      console.log(`RESPONSE (${socket.id}): ${response}`);
      console.log(`AUDIO (${socket.id}): ${speechData.audioFilePath}`);

      socket.emit("responseMessage", {
        response: response,
        speechData: speechData,
      });
    } catch (err) {
      console.error(`ERROR (${socket.id}):`, err.message);

      socket.emit("responseMessage", {
        response: "Sorry, I don't understand that.",
        speechData: null,
      });
    }
  });
});



// Configure Multer for the uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "./public/uploads");

    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath); // Set the destination to the uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original file name
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("resume"), (req, res) => {
  try {
    const filePath = path.join("uploads", req.file.originalname);
    res.status(200).json({
      message: "File uploaded successfully",
      filePath: filePath, // Return the file path in the uploads folder
    });
  } catch (error) {
    res.status(500).json({
      message: "File upload failed",
      error,
    });
  }
});

app.use(express.json());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something broke!");
});

// AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Configure Multer for audio file uploads
const storageaudio = multer.memoryStorage(); // Store files in memory
const audio = multer({ storage: storageaudio });

app.post("/upload-audio", audio.single("audioFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const { originalname, mimetype, buffer } = req.file; // Extract file properties
    const fileName = `${Date.now()}_${originalname}`; // Generate a unique file name

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `audio/${fileName}`, // File path in S3
      Body: buffer, // The file buffer from multer
      ContentType: mimetype, // Set the content type dynamically
    };

    const data = await s3.upload(uploadParams).promise();
    console.log(`File uploaded successfully. ${data.Location}`);

    res.status(200).json({ url: data.Location });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).send("Error uploading file.");
  }
});
const userSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: () => crypto.randomUUID(), // Using Node.js built-in crypto module
    unique: true
  },
  name: String,
  email: String,
  role: String,
  additionalInfo: String, // This can be either college name or last company name based on the role
  interviewStatus: {
    type: String,
    default: "pending",
    enum: ["pending", "scheduled", "completed", "rejected", "accepted"]
  }
});

const User = mongoose.model("User", userSchema);

app.post("/upload-resume", upload.single('resume'), async (req, res) => {
  const { name, email, role, additionalInfo } = req.body;

  try {
    const newUser = new User({ 
      name, 
      email, 
      role, 
      additionalInfo,
      // UUID and interviewStatus will be set by their default values
    });
    await newUser.save();

    // Return a UI-friendly response with all needed information
    res.status(200).json({ 
      success: true,
      message: "Resume uploaded successfully",
      user: {
        uuid: newUser.uuid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        additionalInfo: newUser.additionalInfo,
        interviewStatus: newUser.interviewStatus,
        applicationDate: newUser._id.getTimestamp() // Extract timestamp from MongoDB ObjectId
      },
      nextSteps: {
        message: "Your application has been received. We will review your resume and contact you soon.",
        status: "pending"
      }
    });
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).json({ 
      success: false,
      message: "Error uploading resume", 
      error: err.message 
    });
  }
});

// GET endpoint to retrieve user application data
app.get("/api/allUsers", async (req, res) => {
  try {
    const users = await User.find();
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found"
      });
    }
    
    // Map users to include only the fields you want to expose
    const formattedUsers = users.map(user => ({
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      additionalInfo: user.additionalInfo,
      interviewStatus: user.interviewStatus,
      applicationDate: user._id.getTimestamp()
    }));
    
    res.status(200).json({
      success: true,
      user: formattedUsers
    });
  } catch (err) {
    console.error("Error retrieving users data:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving users data",
      error: err.message
    });
  }
});

// PUT endpoint to update interview status
app.put("/api/applications/:uuid/status", async (req, res) => {
  const { uuid } = req.params;
  const { interviewStatus } = req.body;
  
  try {
    const user = await User.findOne({ uuid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Update interview status
    user.interviewStatus = interviewStatus;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Interview status updated successfully",
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role,
        interviewStatus: user.interviewStatus,
        applicationDate: user._id.getTimestamp()
      }
    });
  } catch (err) {
    console.error("Error updating interview status:", err);
    res.status(500).json({
      success: false,
      message: "Error updating interview status",
      error: err.message
    });
  }
});



app.get('/api/report/:uuid', async (req, res) => {
  try {
      const { uuid } = req.params;
      
      const report = await Report.findOne({ uuid });
      
      if (!report) {
          return res.status(404).json({ error: `No report found for UUID: ${uuid}` });
      }
      
      res.json({
          success: true,
          name: report.name,
          uuid: report.uuid,
          report: report.report,
          createdAt: report.createdAt
      });
      
  } catch (error) {
      console.error('Error retrieving report:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});


server.listen(3000, () => {
  console.log("Server started at https://interviewserver.thinklogics.in");
});

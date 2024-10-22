const express = require("express");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { createServer } = require("http");
const Chatbot = require("./chatEngine.js");
const process = require("process");
const cors = require('cors')
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config();
const Groq = require('groq-sdk');

const app = express();

app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const chatbot = new Chatbot("public" === "public");

app.use(express.static("dist"));

io.on("connection", (socket) => {
    console.log(`CONNECTED ${socket.id}`);

    socket.on("disconnect", (reason) => {
        console.log(`DISCONNECTED ${socket.id}: ${reason}`);
    });

    socket.on("init", (settings) => {
        try {
            chatbot.initialize(settings, socket.id);
            socket.emit("responseInit", true);
            console.log(`INITIALIZED ${socket.id}`);
        } catch (err) {
            console.log(err);
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
            let response;
            console.log("Processing question:", data.question);
            let isAIReplaied = true;
            while(isAIReplaied)
            {
              try{
               response = await chatbot.chat(data.question,data.duration,data.interviewStartTime,data.name);
               isAIReplaied = false;
              }
              catch{
                console.log("Ai replaied error");
              }
            }
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

app.get('/api/evaluateInterview', async (req, res) => {  
  const { interviewDuration: interviewDuration, name } = req.query;  

  if (!interviewDuration || !name) {  
      return res.status(400).json({ error: "interviewStartTime and name are required" });  
  }  

  const interviewProgress = await chatbot.evaluateInterviewProgress(interviewDuration, name);  
            
  return res.json(interviewProgress);  
});

app.use(express.json());
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});



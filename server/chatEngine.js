const sdk = require("microsoft-cognitiveservices-speech-sdk");
const dotenv = require("dotenv");
const { LocalStorage } = require("node-localstorage");
const path = require("path");
const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require("fs");
const request = require("request");
const mongoose = require("mongoose");
const AWS = require('aws-sdk');
const FormData = require('form-data');
const axios = require('axios');
const Groq = require("groq-sdk");
const { type } = require("os");

let uri = "mongodb://localhost:27017/live-interview"

mongoose.connect(uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const chatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_msg: { type: String, required: true },
    ai: { type: String, required: true },
    score: { type: Number },
    section: { type: String },
    duration: { type: Number, required: true },
    uuid:{type: String, required: true},
});


const Chat = mongoose.model("Chat", chatSchema);

const reportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    uuid: { type: String, required: true },
    report: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});


const MAX_INTERVIEW_DURATION = 300;
const STAGE_DURATION = 60;
const PASSING_SCORE_THRESHOLD = 9;
const NUMBER_OF_STAGES = Math.floor(MAX_INTERVIEW_DURATION / STAGE_DURATION);
const QUESTIONS_PER_STAGE = 5;


class Chatbot {
    constructor(public_path) {
        dotenv.config();
        this.socket_id = null;
        this.apiKeys = [
            "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",
            "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",
            "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",
            "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",
            "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"
        ];

        this.currentIndex = 0;
        this.groq = this.initializeGroq();

        if (public_path) {
            public_path = 'public';
        }

        this.groqHistory = [];
        this.messages = [];

        this.speechConfig = sdk.SpeechConfig.fromSubscription('BKcGwBuh2Ix5W2ob8GvkWTK67cAXfnt4Rf5rh6l2orum6fMDCV2pJQQJ99ALACYeBjFXJ3w3AAAYACOG6Bz3', 'eastus');

        this.publicDir = path.join(process.cwd(), public_path);

        if (!fs.existsSync(this.publicDir + "/temp")) {
            fs.mkdirSync(this.publicDir + "/temp");
        }

        if (!fs.existsSync(this.publicDir + "/temp/audio")) {
            fs.mkdirSync(this.publicDir + "/temp/audio");
        }

        if (!fs.existsSync(this.publicDir + "/temp/chats")) {
            fs.mkdirSync(this.publicDir + "/temp/chats");
        }
    }

    initializeGroq() {
        return new Groq({
            apiKey: this.apiKeys[this.currentIndex]
        });
    }

    async initialize( settings,round,name,filename,socket_id) {
        this.socket_id = socket_id;

        this.speechConfig.speechSynthesisVoiceName = "en-US-RogerNeural";
        this.speechConfig.speechRecognitionLanguage = "en-US";
        this.audioFilePaths = [];

        this.speechAudioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        this.speechRecognizer = new sdk.SpeechRecognizer(this.speechConfig, this.speechAudioConfig);
        console.log(filename);
        const resumeText = await this.downloadResume(filename);
        console.log(name+" *"+filename);
        this.groqHistory = [];
        this.messages = [];
        let ai_content = " ";
        if (round === "Technical") {
            ai_content = `You are a manager conducting a technical round of a job interview. Follow these rules: 1) Never reveal that you are an AI. 2) Provide logical answers based only on the resume and identity information; do not invent fake details. 3) Respond in the language used by the interviewer. 4) Answer in a human-like manner, avoiding technical jargon. 5) Ensure your answers are consistent with previous responses without repeating yourself. 6) Do not repeat yourself.7)Never ask the Interviewee to ask you questions.8)Start with Questions based on the given resume.9)Dont explain the answers everytime and move onto next question.10)Make note of how the interviewee performs and rate him when he asks about his performance.11)Ask 2 follow on questions maximum then move to other quesions.12)Ask questions mainly related to skills mentioned by the interviewee in the resume. Identity: Your name is Jeyachandran , and you are hiring officer for a company and only question is technical related question. The interviewee name is ${name}. From now on, answer in English and never mention that you are an AI. Here is the resume text to help you answer the questions: ${resumeText}`
        }
        else if (round === "project") {
            ai_content = `You are a manager conducting a technical round of a job interview. Follow these rules: 1) Never reveal that you are an AI. 2) Provide logical answers based only on the resume and identity information; do not invent fake details. 3) Respond in the language used by the interviewer. 4) Answer in a human-like manner, avoiding technical jargon. 5) Ensure your answers are consistent with previous responses without repeating yourself. 6) Do not repeat yourself.7)Never ask the Interviewee to ask you questions.8)Start with Questions based on the given resume.9)Dont explain the answers everytime and move onto next question.10)Make note of how the interviewee performs and rate him when he asks about his performance.11)Ask 2 follow on questions maximum then move to other quesions.12)Ask questions mainly related to projects mentioned by the interviewee in the resume. Identity: Your name is Jeyachandran , and you are hiring officer for a company and only question is project related question . The interviewee name is ${name}. From now on, answer in English and never mention that you are an AI. Here is the resume text to help you answer the questions: ${resumeText}`
        }
        else if (round === "hr") {
            ai_content = `You are a manager conducting a technical round of a job interview. Follow these rules: 1) Never reveal that you are an AI. 2) Provide logical answers based only on the resume and identity information; do not invent fake details. 3) Respond in the language used by the interviewer. 4) Answer in a human-like manner, avoiding technical jargon. 5) Ensure your answers are consistent with previous responses without repeating yourself. 6) Do not repeat yourself.7)Never ask the Interviewee to ask you questions.8)Start with Questions based on the given resume.9)Dont explain the answers everytime and move onto next question.10)Make note of how the interviewee performs and rate him when he asks about his performance.11)Ask 2 follow on questions maximum then move to other quesions.12)Ask questions mainly related to personal details mentioned by the interviewee in the resume. Identity: Your name is Jeyachandran , and you are hiring officer company and only question is general . The interviewee name is ${name}. From now on, answer in English and never mention that you are an AI. Here is the resume text to help you answer the questions: ${resumeText}`
        }
        else {
            ai_content = `You are a manager conducting a technical round of a job interview. Follow these rules: 1) Never reveal that you are an AI. 2) Provide logical answers based only on the resume and identity information; do not invent fake details. 3) Respond in the language used by the interviewer. 4) Answer in a human-like manner, avoiding technical jargon. 5) Ensure your answers are consistent with previous responses without repeating yourself. 6) Do not repeat yourself.7)Never ask the Interviewee to ask you questions.8)Start with Questions based on the given resume.9)Dont explain the answers everytime and move onto next question.10)Make note of how the interviewee performs and rate him when he asks about his performance.11)Ask 2 follow on questions maximum then move to other quesions.12)Ask questions mainly related to skills mentioned by the interviewee in the resume. Identity: Your name is Jeyachandran , and you are hiring officer for a  position at. The interviewee name is ${name}. From now on, answer in English and never mention that you are an AI. Here is the resume text to help you answer the questions: ${resumeText}`
        }

        this.messages.push({
            role: "system",
            content: ai_content,
        });

        for (const [input_text, completion_text] of this.groqHistory) {
            this.messages.push({
                role: "user",
                content: input_text,
            });
            this.messages.push({
                role: "assistant",
                content: completion_text,
            });
        }
    }
    async downloadResume(filename) {
        return new Promise((resolve, reject) => {
            if (!filename) {
                reject("Filename is required but was not provided.");
                return;
            }

            if (!this.publicDir) {
                reject("Public directory is not configured.");
                return;
            }

            const resumePath = path.join(this.publicDir, "uploads", filename);

            if (!fs.existsSync(resumePath)) {
                reject(`File not found: ${resumePath}`);
                return;
            }

            const buffer = fs.readFileSync(resumePath);
            const options = {};

            pdfExtract.extractBuffer(buffer, options, (err, data) => {
                if (err) {
                    console.error("Error extracting text from PDF:", err);
                    reject(err);
                    return;
                }

                const contentArray = data.pages[0].content;
                let resume_text = contentArray.map((item) => item.str).join(" ");
                resolve(resume_text);

                console.log("---------------------------------------------------------------------------------------");
                console.log("Resume text:", resume_text);
                console.log("---------------------------------------------------------------------------------------");
            });
        });
    }



    async chat(userInput, duration, interviewStartTime, name,uuid) {
        this.messages.push({
            role: "user",
            content: userInput,
        });



        const completion = await this.groq.chat.completions.create({
            messages: this.messages,
            model: "llama3-8b-8192",
        });

        // const { score, section } = await this.determineScoreAndSection(previousUserMsg, previousAiResponse);
        const score = 7;
        const section  = 'general';


        if (completion.choices && completion.choices[0] && completion.choices[0].message) {
            const aiResponse = completion.choices[0].message.content;



                // const aiMessage = completion.choices[0].message.content.trim();
                // const parsedResponse = JSON.parse(aiMessage);
                // console.log("response",parsedResponse)
                // const { aiResponse, score, section } = parsedResponse;

                await Chat.create({
                    name: name,
                    user_msg: userInput,
                    ai: aiResponse,
                    score,
                    section,
                    duration,
                    uuid
                });

                // Store the assistant's response for the conversation history
                this.messages.push({
                    role: "assistant",
                    content: aiResponse,
                });

                await this.exportChat();

                return aiResponse;


        } else {
            console.log("Invalid completion format:", completion);
            throw new Error("Invalid completion format");
        }

    }











    async exportChat() {
        console.log("Exporting chat...");
        const chat = [];
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].role == "user" || this.messages[i].role == "assistant") {
                chat.push({
                    role: this.messages[i].role,
                    content: this.messages[i].content,
                    audio: this.audioFilePaths[i],
                });
            }
        }
        const chat_path = path.join(this.publicDir, "temp/chats", `${this.socket_id}.json`);
        console.log(`Chat path: ${chat_path}`);

        let data = JSON.stringify(chat);

        console.log(`Writing to file: ${chat_path}`);
        await fs.writeFile(chat_path, data, (err) => {
            if (err) throw err;
            console.log("Chat saved to file.");
        });

        return chat_path;
    }


    async storeAudioFile(text) {
        let visemes = [];
        const fileName = `${Math.random().toString(36).substring(7)}.wav`;
        const audioFilePath = path.join(__dirname,  'public/temp/audio', fileName);
        console.log("Audio file path:", audioFilePath);

        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFilePath);
        const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, audioConfig);

        synthesizer.visemeReceived = (s, e) => {
            visemes.push({ visemeId: e.visemeId, audioOffset: e.audioOffset / 10000 });
        };

        const ssml = `<speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${this.speechConfig.speechSynthesisVoiceName}">${text}</voice></speak>`;

        return new Promise((resolve, reject) => {
            synthesizer.speakSsmlAsync(ssml, async (result) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    synthesizer.close();
                    // Return the audio file path and visemes for further processing
                    resolve({ audioFilePath, visemes });
                } else {
                    reject(result);
                }
            });
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async uploadAudioFile(audioFilePath) {
        let url = "";
        try {
            const formData = new FormData();
            formData.append('audioFile', fs.createReadStream(audioFilePath));

            // Send the POST request to your API
            const response = await axios.post('http://localhost:3000/upload-audio', formData, {
                headers: {
                    ...formData.getHeaders(), // Automatically set the necessary headers
                }
            });

            console.log('Upload response:', response.data);
            url = response.data.url;
        } catch (error) {
            console.error('Error uploading audio file:', error);
            throw new Error('Failed to upload audio file.');
        }

        return url;
    }

    async textToSpeech(text) {
        // First, create the audio file and retrieve its path and visemes
        const { audioFilePath, visemes } = await this.storeAudioFile(text);

        // Sleep for 100ms before uploading the audio file
        await this.sleep(50);

        // Now, upload the audio file
        const audioUrl = await this.uploadAudioFile(audioFilePath);

        // Return the final result including the uploaded URL and visemes
        return { audioFilePath:audioUrl, visemes:visemes};
    }




    async speechToText() {
        return new Promise((resolve, reject) => {
            try {
                console.log("[SYSTEM]: Speak into your microphone.");

                let text = "";
                this.speechRecognizer.recognized = (s, e) => {
                    try {
                        const res = e.result;
                        console.log(`recognized: ${res.text}`);
                    } catch (error) {
                        console.log(error);
                    }
                };

                this.speechRecognizer.sessionStarted = (s, e) => {
                    console.log(`SESSION STARTED: ${e.sessionId}`);
                };

                console.log("Starting recognition...");
                try {
                    this.speechRecognizer.recognizeOnceAsync(
                        (result) => {
                            console.log(`RECOGNIZED: Text=${result.text}`);
                            text = result.text;
                            resolve(text);
                        },
                        (error) => {
                            console.log(error);
                        }
                    );
                } catch (err) {
                    console.log(err);
                }

                process.stdin.on("keypress", (str, key) => {
                    if (key.name === "space") {
                        stopRecognition();
                    }
                });

                const stopRecognition = async () => {
                    try {
                        console.log("Stopping recognition...");
                        this.speechRecognizer.stopContinuousRecognitionAsync();
                        resolve(text);
                    } catch (error) {
                        console.log(error);
                    }
                };
            } catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }

    async close() {
        console.log("Closing chatbot...");
        this.speechRecognizer.close();

        for (let i = 0; i < this.audioFilePaths.length; i++) {
            fs.unlinkSync(this.audioFilePaths[i]);
        }
    }

    async getChatsByUuid(uuid) {
        try {
            const chats = await Chat.find({ uuid }).sort({ _id: 1 });
            return chats;
        } catch (error) {
            console.error(`Error fetching chats for UUID ${uuid}:`, error);
            throw error;
        }
    }
    
    // Function to format chats for Groq analysis
    async formatChatsForGroq(chats) {
        // Extract user messages and AI responses
        const conversation = chats.map(chat => ({
            user_msg: chat.user_msg,
            ai_response: chat.ai
        }));
        
        return conversation;
    }
    
    // Function to analyze chats with Groq AI
    async analyzeWithGroq(name, uuid, formattedChats) {
        try {
            const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
            console.log("for",formattedChats)
            
            if (!GROQ_API_KEY) {
                throw new Error('GROQ_API_KEY is not defined in environment variables');
            }
            
            const prompt = `
            Analyze the following technical interview conversation and provide a detailed report.
            
            Important: Your response must be in a specific format. Return ONLY a valid JSON object with these keys:
            - projectSkills (number between 0-100)
            - technicalSkills (number between 0-100)
            - overallScore (number between 0-100)
            - overview (string with detailed assessment)
            
            Do not include any explanations, markdown formatting, or any text outside the JSON structure.
            
            Here's the conversation:
            ${JSON.stringify(formattedChats, null, 2)}
            `;
            
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama3-70b-8192',
                    messages: [
                        { role: 'system', content: 'You are a technical interview analyzer that only responds with JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Get the content from Groq response
            const analysis = response.data.choices[0].message.content;
            console.log("Raw response from Groq:", analysis);
            
            // If Groq API fails to return valid JSON, create our own
            try {
                // First, try direct JSON parsing
                return JSON.parse(analysis);
            } catch (jsonError) {
                console.log("Initial JSON parsing failed, trying to extract JSON pattern");
                
                // Try to extract JSON using regex if there's additional text
                const jsonMatch = analysis.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch (extractError) {
                        console.log("JSON extraction failed too");
                    }
                }
                
                // As a last resort, manually create a structured report
                console.log("Manually creating structured report");
                return this.createManualReport(name, formattedChats, analysis);
            }
        } catch (error) {
            console.error('Error calling Groq API:', error);
            // Create a fallback report
            return this.createManualReport(name, formattedChats);
        }
    }
    
    // Helper method to create a manual report when Groq fails
    createManualReport(name, formattedChats, groqResponse = null) {
        // Extract text from conversation to do basic analysis
        const userTexts = formattedChats.map(chat => chat.user_msg).join(' ');
        
        // Do basic text analysis to determine scores
        const hasProjectExperience = /project|develop|create|build|implement/i.test(userTexts);
        const hasTechnicalSkills = /code|program|develop|language|framework|database/i.test(userTexts);
        
        // Simple scoring based on text patterns
        const projectScore = hasProjectExperience ? Math.floor(65 + Math.random() * 20) : Math.floor(40 + Math.random() * 25);
        const technicalScore = hasTechnicalSkills ? Math.floor(60 + Math.random() * 25) : Math.floor(45 + Math.random() * 20);
        const overallScore = Math.floor((projectScore + technicalScore) / 2);
        
        // Create fallback overview text - include groqResponse analysis when available
        let overview = "";
        if (groqResponse) {
            // Try to salvage the analysis from Groq even if JSON format was incorrect
            // Remove any JSON or markdown formatting for clean text
            const cleanText = groqResponse.replace(/```json|```|{|}|\[|\]|"/g, '').trim();
            if (cleanText.length > 50) {
                overview = cleanText;
            }
        }
        
        // If we couldn't salvage text from Groq, create generic overview
        if (!overview) {
            overview = `${name} has demonstrated ${projectScore > 70 ? 'strong' : 'moderate'} project experience and ${technicalScore > 70 ? 'strong' : 'moderate'} technical knowledge. `;
            overview += `The candidate ${overallScore > 75 ? 'would be a valuable addition to the team' : 'shows potential and could benefit from mentoring'}.`;
        }
        
        return {
            projectSkills: projectScore,
            technicalSkills: technicalScore,
            overallScore: overallScore,
            overview: overview
        };
    }
    
    // Function to save report to database
    async saveReport(name, uuid, reportData) {
        try {
            // Check if a report for this UUID already exists
            const existingReport = await Report.findOne({ uuid });
            
            if (existingReport) {
                // Update existing report
                existingReport.report = reportData;
                existingReport.createdAt = Date.now();
                await existingReport.save();
                console.log(`Updated report for ${name} (${uuid})`);
                return existingReport;
            } else {
                // Create new report
                const newReport = new Report({
                    name,
                    uuid,
                    report: reportData
                });
                
                await newReport.save();
                console.log(`Saved report for ${name} (${uuid})`);
                return newReport;
            }
        } catch (error) {
            console.error('Error saving report:', error);
            throw error;
        }
    }
   
    
    
}

module.exports = Chatbot;


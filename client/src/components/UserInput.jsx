

import React, { useState, useEffect, useRef } from "react";
import { useChatbot } from "./useChatbot";
import debounce from "lodash.debounce";
import { Mic, MicOff } from "lucide-react";
import '../pages/Advance.css';

const UserInput = ({ setResponse, isChatbotReady, setIsChatbotReady, response }) => {
  const urlParams = new URLSearchParams(window.location.search);
  let showSettings = urlParams.get("showSettings") || true;

  const [visible, setVisible] = useState(showSettings);
  const [settings, setSettings] = useState({
    job_title: urlParams.get("job_title") || "Software Engineer",
    company_name: urlParams.get("company_name") || "Google",
    interviewer_name: urlParams.get("interviewer_name") || "Jeyachandran J",
    link_to_resume: "https://jeyachandranj.github.io/resume/Resume.pdf",
    resume_title: urlParams.get("resume_title") || 'all'
  });

  const { initChatbot, sendMessage, error } = useChatbot(setResponse, settings, setIsChatbotReady);
  const [speechText, setSpeechText] = useState("");
  const [listening, setListening] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    initChatbot().then((ready) => {
      setIsChatbotReady(ready);
    });
  }, [settings]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp4' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.current.start();
      setListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setListening(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Create FormData object to send the audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.m4a');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSpeechText(prevText => prevText + ' ' + data.text.trim());
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const debouncedSendMessage = debounce((message) => {
    if (!message) return;
    if (listening) {
      stopRecording();
    }
    sendMessage(message);
  }, 500);

  useEffect(() => {
    if (response.response) {
      const words = response.response.split(' ');
      const newChunks = [];
      for (let i = 0; i < words.length; i += 5) {
        newChunks.push(words.slice(i, i + 5).join(' '));
      }
      setChunks(newChunks);
      setCurrentChunkIndex(0);
    }
  }, [response.response]);

  useEffect(() => {
    if (chunks.length > 0) {
      const timer = setInterval(() => {
        setCurrentChunkIndex((prevIndex) => {
          if (prevIndex + 1 < chunks.length) {
            return prevIndex + 1;
          } else {
            clearInterval(timer);
            setChunks([]);
            return prevIndex;
          }
        });
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [chunks]);

  const handleInputChange = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      debouncedSendMessage(speechText);
      setSpeechText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      return;
    }
    setSpeechText(e.target.value);
    autoResize(e.target);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (listening) {
          stopListening();
        }
        if (speechText !== "") {
          debouncedSendMessage(speechText);
          setSpeechText("");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [speechText, listening]);

  const autoResize = (element) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  return (
    <div className="chatbotInputWrap" style={{ width: "500px", marginTop: "0px" }}>
      {/* {chunks.length > 0 && (
        <div className="chatbotResponse" style={{
          border: "3px solid black",
          backgroundColor: "white",
          marginLeft: "200px",
          marginTop:"300px",
          padding: "10px",
          fontSize: "20px",
          whiteSpace: "pre-wrap",
        }}>
          {chunks[currentChunkIndex]}
        </div>
      )} */}
      {isChatbotReady ? (
        <section className="chatbotInputContainer">
          <div className="chatbotInput" data-listening={listening}>
            <div className="chatbotInput_container">
              <form onSubmit={(e) => e.preventDefault()} className="inputForm" style={{ marginLeft: "200px", marginBottom: "360px" }}>
                <div className="microphoneIcon" style={{ marginBottom: '100px' }}>
                  <button 
                    type="button" 
                    onClick={toggleListening} 
                    className="mic-button" 
                    style={{ 
                      backgroundColor: listening ? 'red' : 'black',
                      marginRight: "300px",
                      marginBottom:'550px',
                      padding: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    disabled={isProcessing}
                  >
                    {listening ? (
                      <MicOff size={24} color="white" />
                    ) : (
                      <Mic size={24} color="white" />
                    )}
                  </button>
                </div>

                <textarea
                  onPaste={(e) => {
                    e.preventDefault()
                    return false;
                  }}
                  onCopy={(e) => {
                    e.preventDefault()
                    return false;
                  }}
                  ref={inputRef}
                  value={speechText}
                  onChange={handleInputChange}
                  style={{
                    color: "black",
                    backgroundColor: "white",
                    fontSize: "18px",
                    width: "450px",
                    height: "100px",
                    padding: "10px",
                    borderRadius: "8px",
                    maxHeight: "200px",
                    border: listening ? "3px solid red" : "2px solid #ccc",
                    transition: "border 0.3s ease, box-shadow 0.3s ease",
                    overflow: "hidden",
                    resize: "none",
                  }}
                  placeholder="Speak or type a message..."
                />
              </form>
            </div>
          </div>
        </section>
      ) : (
        <></>
      )}
    </div>
  );
};

export default UserInput;
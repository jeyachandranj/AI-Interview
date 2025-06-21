import React, { useState, useEffect } from 'react';
import PhoneDetectionComponent from '../components/ObjectDetection';
import { useNavigate } from 'react-router-dom';
import Advance from "./Advance";
const RoundsComponent = () => {
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [timer, setTimer] = useState(0);
  const [currentRound, setCurrentRound] = useState("Technical");
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate(); 
  const totalTime = 30 * 60; // Total interview time in seconds (30 minutes)
  const roundDurations = {
    Technical: 10 * 60,
    Project: 10 * 60,
    HR: 10 * 60,
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);

    // Update the current round based on the time elapsed
    if (timer >= 20 * 60 && currentRound !== "HR") {
      setPopupMessage('You have completed the Project round. Next round is HR.');
      setCurrentRound("HR");
    } else if (timer >= 10 * 60 && timer < 20 * 60 && currentRound !== "Project") {
      setPopupMessage('You have completed the Technical round. Next round is Project.');
      setCurrentRound("Project");
    } else if (timer < 10 * 60 && currentRound !== "Technical") {
      setCurrentRound("Technical");
    }
    localStorage.setItem("round", currentRound);

    if (timer >= totalTime) {
      clearInterval(interval); 
      setPopupMessage('Interview process is completed. Thank you!');
      navigate('/interviewend'); 
    }

    return () => clearInterval(interval); 
  }, [timer, currentRound, navigate]); 

  const getCircleProgress = () => {
    return (timer / totalTime) * 100;
  };
  const closePopup = () => setPopupMessage('');

  const isRoundCompleted = (round) => {
    switch (round) {
      case "Technical":
        return timer >= roundDurations.Technical;
      case "Project":
        return timer >= roundDurations.Technical + roundDurations.Project;
      case "HR":
        return timer >= roundDurations.Technical + roundDurations.Project + roundDurations.HR;
      default:
        return false;
    }
  };

  const containerStyle = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f0f8ff',
   };
   
   const contentStyle = {
    marginLeft: '280px',
    flex: 1,
    padding: '30px',
    backgroundColor: '#f0f8ff',
    height: '98vh', // Reduced from 100vh
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Align content to top
    overflow: 'hidden' // Prevent scrolling
   };
  
  const sidebarStyle = {
    width: '280px',
    backgroundColor: '#fff',
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid #e0e0e0',
    position: 'fixed',
    height: '100vh',
    left: 0,
  };
  
  
  
  const roundButtonStyle = (isCompleted) => ({
    width: '200px',
    padding: '12px',
    margin: '8px 0',
    borderRadius: '10px',
    backgroundColor: isCompleted ? '#4CAF50' : '#e3f2fd',
    color: isCompleted ? '#fff' : '#333',
    fontWeight: '500',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  });
  
  const timerCircleStyle = {
    margin: '40px 0',
    position: 'relative',
    width: '160px',
    height: '160px',
  };
  
  const timerTextStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '22px',
    fontWeight: '600',
    color: '#333',
  };
  
  const currentRoundStyle = {
    fontSize: '18px',
    fontWeight: '500',
    color: '#333',
    marginTop: '-30px',
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#e3f2fd',
  };

  const calculateTimeLeft = (totalTime, timer) => {
    const timeLeft = totalTime - timer;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Update component props
  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '30px' }}>ROUNDS</h1>
        <div style={roundButtonStyle(isRoundCompleted("Technical"))}>Technical</div>
        <div style={roundButtonStyle(isRoundCompleted("Project"))}>Project</div>
        <div style={roundButtonStyle(isRoundCompleted("HR"))}>HR</div>
  
        <div style={timerCircleStyle}>
          <svg width="150" height="150">
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="#e0eaff"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="#4b9eff"
              strokeWidth="10"
              fill="none"
              strokeDasharray="377"
              strokeDashoffset={377 - (377 * getCircleProgress()) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div style={timerTextStyle}>{calculateTimeLeft(totalTime, timer)}</div>
        </div>
  
        <div style={currentRoundStyle}>
          Current Round: {currentRound}
        </div>
  
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%',
          border: `3px solid ${isPhoneDetected ? '#ff4444' : '#4CAF50'}`,
          marginTop: 'auto',
          marginBottom: '30px'
        }}>
          <PhoneDetectionComponent onPhoneDetect={setIsPhoneDetected} />
        </div>
      </div>
  
      <div style={contentStyle}>
        <Advance />
      </div>
    </div>
  );
}

export default RoundsComponent;



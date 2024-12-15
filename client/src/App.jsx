import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Advance from './pages/Advance';
import Lagin from './pages/Login';

import ResumeUpload from './pages/ResumeUpload'
import InterviewInstruction from './pages/InterviewInstruction';
import Start from "./pages/Interview"
import ObjectDetection from './components/ObjectDetection';
import InterviewEnd from './pages/InterviewEnd';
import ProfilePage from './pages/ProfilePage';
import SettingsDisplay from './components/SettingsDisplay';

function App() {
 

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Lagin />} />
        <Route path="/resumupload" element={<ResumeUpload/>}/>
        <Route path="/interview1" element={<Advance />} />
        <Route path="/InterviewInstruction" element={<InterviewInstruction/>}/>
        <Route path="/objectDetection" element={<ObjectDetection/>}/>
        <Route path="/interview" element={<Start/>}/>
        <Route path="/interviewend" element={<InterviewEnd/>}/>
        <Route path="/profilepage" element={<ProfilePage/>} />
        <Route path="/settingsDisplay" element={<SettingsDisplay/>}/>
       
      </Routes>

    </div>
  );
}

export default App;
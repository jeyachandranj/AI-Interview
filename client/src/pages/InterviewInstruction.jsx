import React, { useState } from 'react';
import './InterviewInstruction.css';
import { FaBullseye, FaFileAlt, FaRobot, FaChartLine } from 'react-icons/fa';
import TopBar from './TopBar';
import { Link } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function InterviewInstruction() {
    const [isChecked, setIsChecked] = useState(false);
    const navigate = useNavigate();

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
    };
    const handleContinue = () => {
        if (isChecked) {
          navigate('/settingsDisplay');
        } else {
            toast.error('Please agree to the terms and conditions before proceeding.');
        }
      };
    return (
        <>
              <ToastContainer />
        <div className="flex flex-center">
        <div className="interview-process-container flex flex-col items-center justify-center"> 
         <div style={{ position: "fixed", top: 0, left: 0, width: "200px", zIndex: 1000 }}>
        <TopBar />
      </div>
      <div className="div-container">
        <h1 className="font-bold">INTERVIEW PROCESS</h1>
        </div>            
        <div className="section-container">
            <div className="section-box">
                        <div className="icon-text">
                            <FaBullseye className="icon" />
                            <h3>Stay Focused</h3>
                        </div>
                        <p>Once the interview begins, your screen will be monitored. Any diversions or prolonged absences will automatically end the interview.</p>
                    </div>
                   
                    <div className="section-box">
                        <div className="icon-text">
                            <FaFileAlt className="icon" />
                            <h3>Resume-Based Questions</h3>
                        </div>
                        <p>Tailored questions will be asked based on your resume. Be prepared to answer questions about your experiences, skills, and achievements.</p>
                    </div>
                   
                    <div className="section-box">
                        <div className="icon-text">
                            <FaRobot className="icon" />
                            <h3>AI-Powered Evaluation</h3>
                        </div>
                        <p>Get real-time feedback on your responses and performance, analyzed by our AI-powered model in real time, assessing both content and quality.</p>
                    </div>

                    <div className="section-box">
                        <div className="icon-text">
                            <FaChartLine className="icon" />
                            <h3>Receive Your Performance Report</h3>
                        </div>
                        <p>After the interview, get a detailed report on your performance, including insights and areas for improvement, which will be emailed to you.</p>
                    </div>

                    <div className="terms-section">
                        <input
                            type="checkbox"
                            id="termsCheckbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                        />
                        <label htmlFor="termsCheckbox" className="terms-label">
                            I agree to the terms and conditions
                        </label>
                        <button
                onClick={handleContinue}
                className={`mt-4 ml-10 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                  isChecked
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="ml-1.5 h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                  />
                </svg>
              </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default InterviewInstruction;
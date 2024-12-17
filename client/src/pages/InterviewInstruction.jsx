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
      <section className="bg-gray-100 h-full">
        <ToastContainer />
        <button
          onclick={() => window.history.back()}
          class="absolute top-4 outline-none left-4 border-none text-gray-600 hover:text-gray-900 font-medium text-lg "
        >
          &larr; Back
        </button>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white m-10 shadow-lg rounded-lg p-8 max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                INTERVIEW PROCESS
              </h1>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white border rounded-lg shadow-md flex items-start">
                <FaBullseye className="text-pink-500 mr-4 mt-1 w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Stay Focused
                  </h3>
                  <p className="text-gray-600">
                    Once the interview begins, your screen will be monitored.
                    Any diversions or prolonged absences will automatically end
                    the interview.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-md flex items-start">
                <FaFileAlt className="text-pink-500 mr-4 mt-1 w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Resume-Based Questions
                  </h3>
                  <p className="text-gray-600">
                    Tailored questions will be asked based on your resume. Be
                    prepared to answer questions about your experiences, skills,
                    and achievements.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-md flex items-start">
                <FaRobot className="text-pink-500 mr-4 mt-1 w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    AI-Powered Evaluation
                  </h3>
                  <p className="text-gray-600">
                    Get real-time feedback on your responses and performance,
                    analyzed by our AI-powered model in real time, assessing
                    both content and quality.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-md flex items-start">
                <FaChartLine className="text-pink-500 mr-4 mt-1 w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Receive Your Performance Report
                  </h3>
                  <p className="text-gray-600">
                    After the interview, get a detailed report on your
                    performance, including insights and areas for improvement,
                    which will be emailed to you.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-start space-x-3">
              <input
                type="checkbox"
                id="termsCheckbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="mr-2"
              />

              <label htmlFor="termsCheckbox" className="text-gray-600">
                I agree to the terms and conditions
              </label>
              <button
                onClick={handleContinue}
                className={`w-32 flex p-2 ml-4 ${
                  isChecked
                    ? "bg-indigo-500 text-white hover:bg-indigo-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
      </section>
    );
}

export default InterviewInstruction;
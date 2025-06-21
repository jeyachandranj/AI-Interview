import React, { useState, useEffect } from 'react';
import { Lock, Play, CheckCircle, XCircle, Save, Code, Terminal, Layout, Sun, Check } from 'lucide-react';
import Editor from "@monaco-editor/react";
import { Link } from 'react-router-dom';

const SecureCodingAssessment = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [theme, setTheme] = useState("vs-light");
  const [editorOptions, setEditorOptions] = useState({
    minimap: { enabled: true },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: "on",
    renderLineHighlight: "all",
    lineNumbers: "on",
    folding: true,
    cursorBlinking: "smooth",
    fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
    fontLigatures: true,
  });

  const correctPassword = "123"; // In a real app, this would be stored securely

  // Language mapping for Monaco Editor
  const languageMapping = {
    javascript: "javascript",
    java: "java",
    c: "c",
    cpp: "cpp"
  };

  // Example coding questions
  const questions = [
    {
      id: 1,
      title: "Return the Same Number",
      description: "Write a function that takes a number and returns the same number.",
      difficulty: "Very Easy",
      examples: [
        { input: "5", output: "5" },
        { input: "-10", output: "-10" }
      ],
      starterCode: {
        javascript: "function returnNumber(num) {\n  // Your code here\n}",
        java: "public class Solution {\n  public static int returnNumber(int num) {\n    // Your code here\n    return 0;\n  }\n}",
        c: "#include <stdio.h>\n\nint returnNumber(int num) {\n  // Your code here\n  return 0;\n}",
        cpp: "#include <iostream>\n\nint returnNumber(int num) {\n  // Your code here\n  return 0;\n}"
      }
    },
    {
      id: 2,
      title: "Return 'Hello, World!'",
      description: "Write a function that returns the string 'Hello, World!'.",
      difficulty: "Very Easy",
      examples: [
        { input: "()", output: "\"Hello, World!\"" }
      ],
      starterCode: {
        javascript: "function helloWorld() {\n  // Your code here\n}",
        java: "public class Solution {\n  public static String helloWorld() {\n    // Your code here\n    return \"\";\n  }\n}",
        c: "#include <stdio.h>\n\nchar* helloWorld() {\n  // Your code here\n  return \"\";\n}",
        cpp: "#include <string>\n\nstd::string helloWorld() {\n  // Your code here\n  return \"\";\n}"
      }
    }
  ];

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
      requestFullScreen();
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const requestFullScreen = () => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
    
    setIsFullScreen(true);
  };

  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    setIsFullScreen(false);
  };

  const handleExitAssessment = () => {
    setPassword('');
    setIsAuthenticated(false);
    exitFullScreen();
    setCurrentQuestionIndex(0);
    setCode('');
    setIsCompleted(false);
  };

  const runCode = () => {
    setIsSubmitting(true);
    setError('');
    
    // Simulate code execution (in a real app, you'd use a backend service)
    setTimeout(() => {
      try {
        if (language === 'javascript') {
          // Very simple JavaScript execution simulation
          // In a real app, you'd use a secure sandboxed environment
          const currentQuestion = questions[currentQuestionIndex];
          if (currentQuestion.id === 1) {
            const findMaxFunc = new Function('arr', code.replace('function findMax(arr) {', ''));
            const result = findMaxFunc([1, 3, 5, 2, 4]);
            setOutput(`Output: ${result}`);
            
            if (result === 5) {
              setOutput('✓ All test cases passed successfully!');
            } else {
              setError('✗ Test failed. Expected 5, got ' + result);
            }
          } else if (currentQuestion.id === 2) {
            const reverseStringFunc = new Function('str', code.replace('function reverseString(str) {', ''));
            const result = reverseStringFunc('hello');
            
            if (result === 'olleh') {
              setOutput('✓ All test cases passed successfully!');
            } else {
              setError('✗ Test failed. Expected "olleh", got "' + result + '"');
            }
          }
        } else {
          // For other languages, just show a message
          setOutput('Code compilation simulated. In a real application, this would connect to a backend service for compilation and execution.');
        }
      } catch (e) {
        setError(`✗ Error: ${e.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };


  const submitAnswer = () => {
    runCode();
    
    // In a real app, you'd verify the solution is correct
    // For this demo, we'll just move to the next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setCode(questions[currentQuestionIndex + 1].starterCode[language]);
        setOutput('');
        setError('');
      }, 2000);
    } else {
      setTimeout(() => {
        setIsCompleted(true);
      }, 2000);
    }
  };

  // Handle editor change
  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  // Listen for escape key to prevent exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAuthenticated && (e.key === 'Escape' || e.key === 'F11')) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Set initial code based on selected language
    if (questions.length > 0) {
      setCode(questions[currentQuestionIndex].starterCode[language]);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated, currentQuestionIndex, language]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (isAuthenticated && !(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)) {
        // If user tries to exit fullscreen, go back to password screen
        setIsAuthenticated(false);
        setPassword('');
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, [isAuthenticated]);

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        <div className="bg-gray-100 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-green-500 p-4 rounded-full">
              <CheckCircle className="text-white w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold text-center">Assessment Completed!</h2>
            <p className="text-center text-gray-600 text-lg">You have successfully completed all coding challenges.</p>
            <div className="w-full pt-6">
              <Link to='/InterviewInstruction'><button
                onClick={() => {
                  setIsAuthenticated(false);
                  setIsCompleted(false);
                  setPassword('');
                  exitFullScreen();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Exit Assessment
              </button></Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-white text-black">
        <div className="bg-white p-10 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-blue-500 p-4 rounded-full">
              <Lock className="text-white w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold text-center">Secure Coding Assessment</h1>
            <p className="text-center text-gray-600">
              Enter the assessment password to begin. The system will lock in fullscreen mode for security.
            </p>
            <div className="w-full space-y-5 mt-4">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="Enter password"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg placeholder-gray-400"
                />
              </div>
              {passwordError && <p className="text-red-500 text-sm font-medium">{passwordError}</p>}
              <button
                onClick={handlePasswordSubmit}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-4 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
              >
                <span>Unlock Assessment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-screen bg-white text-black overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <Code className="w-6 h-6 mr-3 text-blue-500" />
          <h1 className="text-xl font-bold">Secure Coding Assessment</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-200 px-3 py-1 rounded-full">
            <Sun className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm">Light Mode</span>
          </div>
          <div className="flex items-center">
            <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
              Question {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Question */}
        <div className="w-2/5 bg-gray-50 overflow-y-auto border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{currentQuestion.title}</h2>
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                {currentQuestion.difficulty}
              </span>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200 shadow-sm">
              <p className="text-gray-700">{currentQuestion.description}</p>
            </div>
            
            
            <div className="mb-6">
              <h3 className="font-bold mb-3 text-blue-400">Examples:</h3>
              {currentQuestion.examples.map((example, index) => (
                <div key={index} className="mb-3 bg-gray-700 p-4 rounded-lg">
                  <div className="mb-2"><span className="text-gray-400 font-medium">Input:</span> <span className="font-mono">{example.input}</span></div>
                  <div><span className="text-gray-400 font-medium">Output:</span> <span className="font-mono">{example.output}</span></div>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-bold text-blue-400">Language:</label>
              <div className="grid grid-cols-4 gap-2">
                {['javascript', 'java', 'c', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setCode(currentQuestion.starterCode[lang]);
                    }}
                    className={`py-2 px-3 rounded-lg text-center text-sm font-medium transition-colors ${
                      language === lang 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Code editor and output */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Code editor with Monaco */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <Layout className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm font-medium">Code Editor</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-sm px-2 py-1 rounded-md text-gray-300"
                  onClick={() => setEditorOptions({...editorOptions, fontSize: editorOptions.fontSize + 1})}
                >
                  A+
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-sm px-2 py-1 rounded-md text-gray-300"
                  onClick={() => setEditorOptions({...editorOptions, fontSize: Math.max(10, editorOptions.fontSize - 1)})}
                >
                  A-
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-sm px-2 py-1 rounded-md text-gray-300"
                  onClick={() => setEditorOptions({...editorOptions, minimap: {enabled: !editorOptions.minimap.enabled}})}
                >
                  {editorOptions.minimap.enabled ? 'Hide Minimap' : 'Show Minimap'}
                </button>
              </div>
            </div>
            <div className="h-full pt-10">
              <Editor
                height="400px"
                width="800px"
                language={languageMapping[language]}
                theme={theme}
                value={code}
                onChange={handleEditorChange}
                options={editorOptions}
                className="monaco-editor-container"
              />
            </div>
          </div>
          
          {/* Output panel */}
          <div className="h-2/4 bg-gray-800 border-t border-gray-700" style={{width:"800px"}}>
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <Terminal className="w-4 h-4 mr-2 text-blue-400" />
                <span className="text-sm font-medium">Console Output</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={runCode}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto h-full font-mono text-sm">
              {output && (
                <div className="p-3 rounded-md mb-2 bg-green-900/30 text-green-400 border border-green-800">
                  {output}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-md bg-red-900/30 text-red-400 border border-red-800">
                  {error}
                </div>
              )}
              {!output && !error && (
                <div className="text-gray-500 italic">
                  Run your code to see the output here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureCodingAssessment;
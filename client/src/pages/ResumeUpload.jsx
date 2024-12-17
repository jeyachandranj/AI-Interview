import React, { useState, useEffect } from "react";
import "./ResumeUpload.css";
import resumupload from "../assets/resumupload.png";
import TopBar from "./TopBar";
import { useNavigate } from "react-router-dom";
import { getDocument } from "pdfjs-dist/build/pdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import the styles for toast

const UploadResume = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [pdfText, setPdfText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("name");
    const storedRole = localStorage.getItem("role");
    const storedAdditionalInfo = localStorage.getItem("additionalInfo");
    const storedFileName = localStorage.getItem("fileName");

    if (storedName) setName(storedName);
    if (storedRole) setRole(storedRole);
    if (storedAdditionalInfo) setAdditionalInfo(storedAdditionalInfo);
    if (storedFileName) setFileName(storedFileName);
  }, []);

  useEffect(() => {
    localStorage.setItem("name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem("additionalInfo", additionalInfo);
  }, [additionalInfo]);

  useEffect(() => {
    localStorage.setItem("fileName", fileName);
  }, [fileName]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      extractTextFromPDF(selectedFile);
      toast.success("Resume uploaded successfully!");
    }
  };

  const extractTextFromPDF = async (file) => {
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target.result);
      const pdf = await getDocument(typedArray).promise;
      let text = "";

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        text += pageText + " ";
      }

      setPdfText(text.trim());
      console.log("Extracted PDF Text:", pdfText);
    };

    fileReader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a resume!", {
        autoClose: 800,
      });
      return;
    }

    if (!name.trim()) {
      toast.info("Please enter your name!", {
        autoClose: 800,
      });
      return;
    }

    if (name) {
      localStorage.setItem("name", name);
    }
    const customFileName = `${name.replace(/\s+/g, "_")}.pdf`;
    localStorage.setItem("rename", customFileName);
    const renamedFile = new File([file], customFileName, { type: file.type });

    const formData = new FormData();
    formData.append("resume", renamedFile);
    formData.append("fileName", customFileName);
    formData.append("role", role);
    formData.append("additionalInfo", additionalInfo);

    try {
      const uploadResponse = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (uploadResponse.ok) {
        toast.success("Resume uploaded successfully!"); // Success toast
        const email = localStorage.getItem("email");
        console.log("Resume uploaded:", file);
        console.log("Uploaded file name:", uploadResult.fileName);
        const userData = {
          name: name,
          email: email,
          role: role,
          additionalInfo: additionalInfo,
        };

        const response = await fetch("http://localhost:3000/upload-resume", {
          // Make sure this matches your backend URL
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        const result = await response.json();
        if (response.ok) {
          console.log("User data saved:", result.user);
          toast.success("Resume uploaded successfully!");
          navigate("/InterviewInstruction");
        }
      } else {
        toast.error("An error occurred during file upload.", {
          autoClose: 800,
        });
      }
    } catch (error) {
      toast.error("An error occurred during file upload.", {
        autoClose: 800,
      });
      console.error("Error uploading file:", error);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
      setFileName(file.name);
      extractTextFromPDF(file);
    } else {
      toast.error("Please upload a PDF file.");
    }
  };

  return (
    <>
      <section className="flex items-center justify-center bg-slate-50">
        <div className="upload-container border border-black">
          <h2 className="text-3xl" style={{ fontFamily: "Roboto" }}>
            Upload Resume
          </h2>
          <div className="upload-content mt-16 ">
            <div className="upload-image">
              <img src={resumupload} alt="Upload Illustration" />
            </div>
            <div className="upload-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <section className="form-group">
                  <label>Designation</label>

                  <div className="flex justify-start space-x-4">
                    <label
                      className={`w-32 p-2 flex items-center justify-center rounded-lg cursor-pointer ${
                        role === "Student"
                          ? "border-green-500"
                          : "border-gray-300"
                      }`}
                      style={{
                        border:
                          role === "Student"
                            ? "1px solid blue"
                            : "1px solid gray",
                      }}
                    >
                      <input
                        type="radio"
                        value="Student"
                        checked={role === "Student"}
                        onChange={(e) => setRole(e.target.value)}
                        className="hidden"
                      />
                      <div className="text-center w-full">Student</div>
                    </label>

                    <label
                      className={`w-32 p-2 flex items-center justify-center rounded-lg cursor-pointer ${
                        role === "Employee"
                          ? "border-green-500"
                          : "border-gray-300"
                      }`}
                      style={{
                        border:
                          role === "Employee"
                            ? "1.5px solid blue"
                            : "1px solid gray",
                      }}
                    >
                      <input
                        type="radio"
                        value="Employee"
                        checked={role === "Employee"}
                        onChange={(e) => setRole(e.target.value)}
                        className="hidden"
                      />
                      <div className="text-center w-full">Employee</div>
                    </label>
                  </div>
                </section>
                <div className="form-group">
                  <label>
                    {role === "Student"
                      ? "College Name"
                      : "Last Worked Company"}
                  </label>
                  <input
                    type="text"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder={
                      role === "Student"
                        ? "Enter your college name"
                        : "Enter your last company name"
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Resume</label>
                  <div
                    className="upload-box"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <div className="upload-text">
                      Drag & drop files or <span>Browse</span>
                      <br />
                      Supported formats: PDF
                    </div>
                  </div>
                  {fileName && (
                    <p className="uploaded-file-name">Uploaded: {fileName}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="upload-btn w-40 flex justify-center"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      <ToastContainer autoClose={800} />
    </>
  );
};

export default UploadResume;

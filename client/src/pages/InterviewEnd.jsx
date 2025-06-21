import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import completedImage from "../assets/completed.jpg";

const InterviewEnd = () => {
  const [updateStatus, setUpdateStatus] = useState({ loading: true, error: null });
  const applicationUuid = localStorage.getItem("uuid");

    
  useEffect(() => {
    const updateInterviewStatus = async () => {
      if (!applicationUuid) {
        setUpdateStatus({ 
          loading: false, 
          error: "Application ID not found. Cannot update interview status." 
        });
        return;
      }
      
      try {
        const response = await axios.put(`http://localhost:3000/api/applications/${applicationUuid}/status`, {
          interviewStatus: "completed"
        });
        
        setUpdateStatus({ 
          loading: false, 
          error: null,
          data: response.data
        });
        
        console.log("Interview status updated successfully", response.data);
      } catch (error) {
        console.error("Failed to update interview status:", error);
        setUpdateStatus({ 
          loading: false, 
          error: error.response?.data?.message || "Failed to update interview status"
        });
      }
    };
    
    updateInterviewStatus();
  }, [applicationUuid]);
  
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar Component */}
      <TopBar />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>INTERVIEW END</h1>
        
        {updateStatus.error && (
          <div style={{ color: "red", marginBottom: "20px", padding: "10px", backgroundColor: "#ffeeee", borderRadius: "4px" }}>
            {updateStatus.error}
          </div>
        )}
        
        <img
          src={completedImage}
          alt="Interview Completed"
          style={{ width: "80%", maxWidth: "500px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }}
        />
        
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginTop: "20px" }}>INTERVIEW SUCCESS</h2>
        <p style={{ fontSize: "16px", color: "#555" }}>REPORT WILL BE SHARED IN THE EMAIL</p>
        
        {updateStatus.loading && (
          <p style={{ marginTop: "10px", color: "#666" }}>Updating interview status...</p>
        )}
        
        {!updateStatus.loading && !updateStatus.error && (
          <p style={{ marginTop: "10px", color: "green" }}>Interview status updated successfully!</p>
        )}
      </div>
    </div>
  );
};

export default InterviewEnd;
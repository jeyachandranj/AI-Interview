import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase"; // Import your Firebase auth configuration
import "./Login.css";
import CenterImage from "../assets/main.png";
import Logo from "../assets/logo.png";
import { FaBars } from "react-icons/fa";
import GoogleButton from "react-google-button"; // Import the GoogleButton component
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scale, setScale] = useState(1.9);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;

      // Store user details in localStorage
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("email", user.email);
      localStorage.setItem("name", user.displayName);
      localStorage.setItem("uid", user.uid);

      setUser(user); // Update state with the signed-in user

navigate('/resumupload');  // Redirect after sign-in
    } catch (error) {
      setError(error.message);
      console.error("Google sign-in error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null); // Reset state
      localStorage.clear(); // Clear persistent storage
navigate('/');  // Redirect after sign-in
     
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  // Check for persisted login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Persist user state on page refresh
        setUser(currentUser);
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("email", currentUser.email);
        localStorage.setItem("name", currentUser.displayName);
        localStorage.setItem("uid", currentUser.uid);
      } else {
        // If user is logged out, clear localStorage
        localStorage.clear();
      }
    });

    // If the user is stored in localStorage, set the state on initial render
    const isLoggedIn = localStorage.getItem("loggedIn");
    if (isLoggedIn) {
      setUser({
        email: localStorage.getItem("email"),
        displayName: localStorage.getItem("name"),
        uid: localStorage.getItem("uid"),
      });
    }

    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="gradient">
      <header className="navbar" style={{ backgroundColor: "white", color: "black" }}>
        <div className="logo-container">
          <img
            src={Logo}
            alt="SolveMeter Logo"
            className="logo"
            style={{
              width: "100px",
              height: "80px",
              marginTop: "20px",
              marginLeft: "20px",
              transform: `scale(${scale})`, // Corrected template literal
              transition: "transform 0.3s ease",
            }}
          />
          <span className="logo-text" style={{ fontSize: "40px", marginLeft: "35px", fontFamily: "Cursive" }}>
            TalentLens
          </span>
        </div>
        <nav>
          <FaBars className="menu-icon" onClick={toggleMenu} />
          <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}> {/* Fixed className syntax */}
            <li>Home</li>
            <li>About</li>
            <li>Service</li>
            <li>Contact</li>
          </ul>
        </nav>
      </header>
      <div className="main-content">
        <img src={CenterImage} alt="centered content" className="center-image" />
        {user ? (
          <div>
            <h3>Welcome, {user.displayName}!</h3>
            <button onClick={handleLogout} className="googlebutton mt-4 rounded-pill">
              Log Out
            </button>
          </div>
        ) : (
          <button onClick={handleGoogleSignIn} disabled={isSigningIn} className="googlebutton mt-4 rounded-pill">
            {isSigningIn ? "Signing in..." : <b>Sign in with Google</b>}
          </button>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default LandingPage;

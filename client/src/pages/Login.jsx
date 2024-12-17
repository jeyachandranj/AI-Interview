import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase"; // Import your Firebase auth configuration
import "./Login.css";

import CenterImage from "../assets/main.png";
import Logo from "../assets/logo.png";
import { FaBars } from "react-icons/fa";
import GoogleButton from "react-google-button"; // Import the GoogleButton component
import Bento from "../components/BentoDesign/Bento";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scale, setScale] = useState(1.9);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

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
      window.location.pathname = "/resumupload"; // Redirect after sign-in
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
      window.location.pathname = "/"; // Redirect to home page
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
    <div className="gradient bg-dot-pattern h-screen">
      <header className="navbar" style={{ color: "black" }}>
        <div className="logo-container">
          <span
            className="logo-text"
            style={{
              fontSize: "30px",
              marginLeft: "35px",
              fontFamily: "Poppins",
            }}
          >
            AI Interview
          </span>
        </div>
      </header>
      <div className="main-content bg-dotted h-screen relative w-full  ">
        <div className="absolute inset-0 bg-[radial-gradient(circle,white,transparent_1px)] bg-[length:50px_50px] pointer-events-none"></div>

        <h1 style={{ fontSize: "35px", textAlign: "center" }}>
          Empowering You to <br />
          <span style={{ fontSize: "40px" }}>Ace Every Interview</span>
        </h1>

        {user ? (
          <div className="relative p-6 rounded-lg">
            {/* Dotted background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none rounded-lg"></div>

            <h3 className="relative z-10 text-white text-center font-sans">Welcome, {user.displayName}!</h3>
            <button
              onClick={handleLogout}
              className="googlebutton mt-4 rounded-pill relative z-10"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="relative p-6 rounded-lg">
            {/* Dotted background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none rounded-lg"></div>

            <button
              style={{ backgroundColor: "#7ED6DF", color: "black" }}
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="googlebutton mt-4 rounded-pill relative z-10"
            >
              {isSigningIn ? "Signing in..." : <b>Sign in with Google</b>}
            </button>
            {error && <p className="error-text relative z-10">{error}</p>}
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default LandingPage;

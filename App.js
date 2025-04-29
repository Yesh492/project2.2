import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./styles/App.css";
import "./styles/pages.css";
import "./styles/FeatureCards.css";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import Meditate from "./pages/Meditate";
import FeatureDemo from "./pages/FeatureDemo";

export default function App() {
  const [userId, setUserId] = useState("demo-user");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set up authentication listener
  useEffect(() => {
    console.log('Setting up authentication listener');
    let unsubscribe;

    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in
          console.log('User is signed in:', user.uid);
          setUserId(user.uid);
          setIsAuthenticated(true);
        } else {
          // User is signed out
          console.log('No user signed in, using demo user');
          setUserId('demo-user');
          setIsAuthenticated(false);
        }
        setLoading(false);
      }, (error) => {
        // Handle auth observer error
        console.error('Auth observer error:', error);
        setUserId('demo-user');
        setIsAuthenticated(false);
        setLoading(false);
      });
    } catch (error) {
      // Handle any setup errors
      console.error('Error setting up auth listener:', error);
      setUserId('demo-user');
      setIsAuthenticated(false);
      setLoading(false);
    }

    // Clean up the listener on unmount
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth listener:', error);
        }
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Energiaa...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-bg">
        <Navbar isAuthenticated={isAuthenticated} userId={userId} />

        <motion.div
          className="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/meditate"
              element={<Meditate userId={userId} isAuthenticated={isAuthenticated} />}
            />
            <Route path="/features" element={<FeatureDemo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>

        <Footer />
      </div>
    </Router>
  );
}
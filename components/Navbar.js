import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiInfo, FiLogIn, FiLogOut, FiLayout } from 'react-icons/fi';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar = ({ isAuthenticated, userId }) => {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      // Use Firebase sign-out
      await signOut(auth);
      console.log("Signed out successfully");

      // Force page refresh to update UI
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <motion.header
      className="energiaa-header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <Link to="/" className="energiaa-logo-container">
        <div className="energiaa-title">Energiaa</div>
      </Link>

      <div className="energiaa-nav">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <FiHome className="nav-icon" />
          <span>Home</span>
        </Link>

        <Link
          to="/features"
          className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`}
        >
          <FiLayout className="nav-icon" />
          <span>Features</span>
        </Link>

        <Link
          to="/about"
          className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
        >
          <FiInfo className="nav-icon" />
          <span>About</span>
        </Link>

        {isAuthenticated && userId !== 'demo-user' ? (
          <div className="auth-container">
            <span className="user-greeting">Hello, {userId.substring(0, 6)}...</span>
            <button onClick={handleSignOut} className="sign-out-btn">
              <FiLogOut className="nav-icon" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className={`nav-link sign-in-btn ${location.pathname === '/signin' ? 'active' : ''}`}
          >
            <FiLogIn className="nav-icon" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;

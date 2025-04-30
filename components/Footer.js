import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiGithub, FiMail, FiTwitter, FiInstagram } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="energiaa-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Energiaa</h3>
          <p className="footer-description">
            AI-powered meditation guidance based on your personal photos.
            Discover emotional insights and personalized meditation techniques.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/meditate">Meditate</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/signin">Sign In</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Connect</h4>
          <div className="social-links">
            <a href="#" className="social-link"><FiGithub /></a>
            <a href="#" className="social-link"><FiTwitter /></a>
            <a href="#" className="social-link"><FiInstagram /></a>
            <a href="#" className="social-link"><FiMail /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Energiaa. Made with <FiHeart className="heart-icon" /> using React, Firebase & AI.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCamera, FiSmile, FiHeart, FiSun, FiArrowRight } from 'react-icons/fi';
import FeatureCards from '../components/FeatureCards';

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Discover Your <span className="highlight">Inner Peace</span> Through AI-Powered Meditation
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Upload your photos and let our AI analyze emotions, colors, and visual elements
            to create personalized meditation guidance just for you.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/meditate" className="primary-button">
              Start Meditating <FiArrowRight className="btn-icon" />
            </Link>
            <Link to="/about" className="secondary-button">
              Learn More
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="hero-image-container">
            <FeatureCards
              backgroundImage="https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">How Energiaa Works</h2>

        <div className="features-grid">
          <motion.div
            className="feature-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                alt="Person in yoga pose"
              />
            </div>
            <div className="feature-icon">
              <FiCamera />
            </div>
            <h3 className="feature-title">Upload Your Photo</h3>
            <p className="feature-description">
              Share a moment from your life - a landscape, a selfie, or any image that resonates with you.
            </p>
          </motion.div>

          <motion.div
            className="feature-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                alt="Person meditating in lotus position"
              />
            </div>
            <div className="feature-icon">
              <FiSmile />
            </div>
            <h3 className="feature-title">AI Analysis</h3>
            <p className="feature-description">
              Our AI analyzes emotions, colors, and visual elements in your photo to understand your energy.
            </p>
          </motion.div>

          <motion.div
            className="feature-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="feature-image">
              <img
                src="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                alt="Person in yoga pose"
              />
            </div>
            <div className="feature-icon">
              <FiHeart />
            </div>
            <h3 className="feature-title">Personalized Meditation</h3>
            <p className="feature-description">
              Receive a custom meditation guidance tailored to your emotional state and the energy of your image.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" style={{
        backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.85), rgba(30, 64, 175, 0.85)), url("https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="cta-content">
          <h2 className="cta-title">Ready to Begin Your Journey?</h2>
          <p className="cta-description">
            Start your meditation practice today with personalized guidance based on your photos.
          </p>
          <Link to="/meditate" className="cta-button">
            Start Now <FiArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

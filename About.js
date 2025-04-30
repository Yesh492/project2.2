import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCamera, FiSmile, FiHeart, FiSun, FiArrowRight, FiActivity, FiCloud } from 'react-icons/fi';
import '../styles/About.css';
import yeshvanthImage from './yeshvanth.png';
import sushruthaImage from './sushrutha.png';
import jashwanthImage from './jashwanth.png';
import achyuthImage from './Achyuth.png';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero-section">
        <motion.h1
          className="about-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          About <span className="highlight">Energiaa</span>
        </motion.h1>

        <motion.p
          className="about-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Discover the story behind our AI-powered meditation platform
        </motion.p>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h2 className="section-title">Our Mission</h2>
          <p className="mission-text">
            At Energiaa, we believe that everyone deserves access to personalized meditation guidance
            that resonates with their unique emotional state and life experiences. Our mission is to
            bridge the gap between technology and mindfulness, using artificial intelligence to create
            deeply personal meditation experiences.
          </p>
          <p className="mission-text">
            By analyzing the emotions, colors, and visual elements in your photos, we provide meditation
            guidance that speaks directly to your current state of being, helping you find balance,
            peace, and clarity in your daily life.
          </p>
        </div>

        <div className="mission-image">
          <div className="about-image-container">
            <img
              src="https://images.unsplash.com/photo-1524863479829-916d8e77f114?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Woman in yoga meditation pose on mountain"
              className="mission-img"
            />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section">
        <h2 className="section-title">Our Technology</h2>

        <div className="tech-grid">
          <motion.div
            className="tech-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="tech-icon">
              <FiCamera />
            </div>
            <h3 className="tech-title">Computer Vision</h3>
            <p className="tech-description">
              We use advanced computer vision algorithms to analyze the visual elements, colors, and
              compositions of your photos, extracting meaningful insights about the energy they contain.
            </p>
          </motion.div>

          <motion.div
            className="tech-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="tech-icon">
              <FiActivity />
            </div>
            <h3 className="tech-title">Emotion AI</h3>
            <p className="tech-description">
              Our emotion recognition technology identifies subtle emotional cues in your images,
              helping us understand your emotional state and tailor our guidance accordingly.
            </p>
          </motion.div>

          <motion.div
            className="tech-card"
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="tech-icon">
              <FiCloud />
            </div>
            <h3 className="tech-title">Generative AI</h3>
            <p className="tech-description">
              We leverage state-of-the-art generative AI to create personalized meditation guidance
              that responds to your unique emotional profile and the energy of your images.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2 className="section-title">Our Team</h2>
        <p className="team-intro">
          Energiaa was created by a passionate team of developers, meditation practitioners,
          and AI specialists who believe in the power of technology to enhance mindfulness practices.
        </p>

        <div className="team-members">
          <motion.div
            className="team-member"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -10, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="member-avatar" style={{
              backgroundImage: `url(${yeshvanthImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <h3 className="member-name">Yeshvanth Kumar</h3>
            <p className="member-role">Team Lead & Full Stack Developer</p>
            <p className="member-bio">
              Passionate about creating intuitive user experiences and implementing AI solutions.
              Leads the team with expertise in React, Node.js, and Google Cloud technologies.
            </p>
          </motion.div>

          <motion.div
            className="team-member"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -10, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="member-avatar" style={{
              backgroundImage: `url(${sushruthaImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <h3 className="member-name">Sushrutha Vishal</h3>
            <p className="member-role">AI Specialist & Backend Developer</p>
            <p className="member-bio">
              Expert in machine learning and computer vision algorithms. Responsible for implementing
              the image analysis and emotion detection features of Energiaa.
            </p>
          </motion.div>

          <motion.div
            className="team-member"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -10, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="member-avatar" style={{
              backgroundImage: `url(${jashwanthImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <h3 className="member-name">Jashwanth Reddy</h3>
            <p className="member-role">Frontend Developer & UX Designer</p>
            <p className="member-bio">
              Skilled in creating beautiful and responsive user interfaces. Focuses on making the
              meditation experience seamless and visually appealing.
            </p>
          </motion.div>

          <motion.div
            className="team-member"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -10, boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="member-avatar" style={{
              backgroundImage: `url(${achyuthImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <h3 className="member-name">Achyuth Reddy</h3>
            <p className="member-role">Database Architect & Cloud Engineer</p>
            <p className="member-bio">
              Specializes in database design and cloud infrastructure. Ensures that Energiaa's
              data is secure, scalable, and efficiently managed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section" style={{
        backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.85), rgba(30, 64, 175, 0.85)), url("https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="cta-content">
          <h2 className="cta-title">Experience Energiaa Today</h2>
          <p className="cta-description">
            Upload a photo and discover the power of personalized, AI-generated meditation guidance.
          </p>
          <Link to="/meditate" className="cta-button">
            Start Your Journey <FiArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;

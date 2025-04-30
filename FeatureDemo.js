import React from 'react';
import FeatureCards from '../components/FeatureCards';
import '../styles/FeatureCards.css';

const FeatureDemo = () => {
  // You can use a yoga/meditation image as background
  const backgroundImage = "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80";

  return (
    <div className="feature-demo-page">
      <div className="feature-demo-container">
        <h1 className="feature-demo-title">Discover Your Inner Peace</h1>
        <p className="feature-demo-subtitle">
          Our AI-powered meditation platform analyzes your photos to create personalized guidance
        </p>
        
        {/* Our new organized component */}
        <FeatureCards backgroundImage={backgroundImage} />
        
        <div className="feature-demo-cta">
          <button className="primary-button">Start Your Journey</button>
        </div>
      </div>
    </div>
  );
};

export default FeatureDemo;

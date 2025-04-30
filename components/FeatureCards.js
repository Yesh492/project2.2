import React from 'react';
import { motion } from 'framer-motion';
import { FiSmile, FiSun, FiHeart } from 'react-icons/fi';

const FeatureCards = ({ backgroundImage }) => {
  // Card data for better organization
  const cards = [
    {
      id: 'emotion',
      title: 'Emotion Analysis',
      icon: <FiSmile />,
      color: '#4285F4',
      description: null // Remove description for cleaner look
    },
    {
      id: 'guidance',
      title: 'Personalized Guidance',
      icon: <FiHeart />,
      color: '#4285F4',
      description: null // Remove description for cleaner look
    },
    {
      id: 'color',
      title: 'Color Energy',
      icon: <FiSun />,
      color: '#4285F4',
      description: null // Remove description for cleaner look
    }
  ];

  return (
    <div className="feature-cards-container">
      {backgroundImage && (
        <div className="feature-cards-background">
          <img
            src={backgroundImage}
            alt="Person in yoga pose"
            className="feature-bg-image"
          />
        </div>
      )}

      <div className="feature-cards-grid">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="feature-card-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.2 * index,
              ease: "easeOut"
            }}
            whileHover={{
              y: -10,
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="feature-card-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <h3 className="feature-card-title">{card.title}</h3>
            {card.description && (
              <p className="feature-card-description">{card.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;

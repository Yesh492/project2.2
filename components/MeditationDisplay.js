import React from "react";
import ColorPalette from "./ColorPalette";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

// Helper function to extract title from meditation guidance
const extractTitle = (guidance) => {
  if (!guidance) return "Personalized Meditation";

  // Try to extract the first heading (# Title)
  const headingMatch = guidance.match(/^#\s+(.+)$/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }

  // Fallback to first line
  const firstLine = guidance.split('\n')[0];
  return firstLine.replace(/^#\s*/, '').trim() || "Personalized Meditation";
};

// Helper function to capitalize first letter of each word
const capitalize = (text) => {
  if (!text) return "";
  return text.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function MeditationDisplay({ meditation }) {
  if (!meditation) {
    console.warn("MeditationDisplay received null or undefined meditation");
    return null;
  }

  // Safely extract properties with fallbacks
  const photoUrl = meditation.photoUrl || "";
  const visionResult = meditation.visionResult || {};
  const geminiGuidance = meditation.geminiGuidance || "# Meditation\n\nNo guidance available.";

  // Handle error or not found cases
  if (meditation.error || meditation.notFound) {
    return (
      <motion.div
        className="meditation-display"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="meditation-title">Meditation Not Available</h1>
        <div className="meditation-guidance">
          <div className="markdown-content">
            <ReactMarkdown>
              {geminiGuidance}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  }

  const meditationTitle = extractTitle(geminiGuidance);

  // Remove the title from the guidance for markdown rendering
  const guidanceWithoutTitle = geminiGuidance.replace(/^#[^\n]*\n/, '');

  return (
    <motion.div
      className="meditation-display"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="meditation-title">{meditationTitle}</h1>

      <div className="meditation-content">
        <div className="meditation-image-container">
          <img
            src={photoUrl && photoUrl !== "data:image/jpeg;base64,..."
              ? photoUrl
              : "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}
            alt="Meditation"
            className="meditation-image"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
            }}
          />
        </div>

        <div className="meditation-info">
          <div className="meditation-section">
            <h3 className="section-title">Color Palette</h3>
            <ColorPalette colors={visionResult?.dominantColors} />
          </div>

          <div className="meditation-section">
            <h3 className="section-title">Emotional Tones</h3>
            <div className="emotion-tags">
              {visionResult?.emotions && Object.entries(visionResult.emotions).map(([emotion, value], index) => (
                <span key={index} className="emotion-tag">
                  {capitalize(emotion)}
                </span>
              ))}
            </div>
          </div>

          <div className="meditation-section">
            <h3 className="section-title">Visual Elements</h3>
            <div className="label-tags">
              {visionResult?.labels && visionResult.labels.map((label, index) => (
                <span key={index} className="label-tag">
                  {capitalize(label)}
                </span>
              ))}
            </div>
          </div>

          {visionResult?.landmarks && visionResult.landmarks.length > 0 && (
            <div className="meditation-section">
              <h3 className="section-title">Landmarks</h3>
              <div className="landmark-tags">
                {visionResult.landmarks.map((landmark, index) => (
                  <span key={index} className="landmark-tag">
                    {capitalize(landmark)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visionResult?.objects && visionResult.objects.length > 0 && (
            <div className="meditation-section">
              <h3 className="section-title">Objects</h3>
              <div className="object-tags">
                {visionResult.objects.map((object, index) => (
                  <span key={index} className="object-tag">
                    {capitalize(object)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="meditation-guidance">
        <div className="markdown-content">
          <ReactMarkdown>
            {guidanceWithoutTitle}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
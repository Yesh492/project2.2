import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiImage, FiUser, FiChevronDown, FiChevronUp } from "react-icons/fi";
import UserProfile from "./UserProfile";
import { auth } from "../firebase";

// Helper function to format dates
const formatDate = (timestamp) => {
  if (!timestamp) return "No date";

  let date;
  if (typeof timestamp === 'object' && timestamp.seconds) {
    // Firestore timestamp
    date = new Date(timestamp.seconds * 1000);
  } else {
    // ISO string or other format
    date = new Date(timestamp);
  }

  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date";

  // Format the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper function to extract title from meditation guidance
const extractTitle = (guidance) => {
  if (!guidance) return "Untitled Meditation";

  // Try to extract the first heading (# Title)
  const headingMatch = guidance.match(/^#\s+(.+)$/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }

  // Fallback to first line
  const firstLine = guidance.split('\n')[0];
  return firstLine.replace(/^#\s*/, '').trim() || "Untitled Meditation";
};

export default function Sidebar({ meditations = [], onSelect, selectedId }) {
  // State for showing/hiding user profile
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = !!auth.currentUser && !auth.currentUser.isAnonymous;

  // Ensure meditations is an array
  const safeMediatons = Array.isArray(meditations) ? meditations : [];

  // Filter out any undefined or null items
  const validMeditations = safeMediatons.filter(m => m && m.id);

  // Toggle user profile visibility
  const toggleUserProfile = () => {
    setShowUserProfile(!showUserProfile);
  };

  return (
    <aside className="sidebar">
      {/* User Profile Section */}
      {isAuthenticated && (
        <div className="sidebar-user-section">
          <div className="sidebar-user-header" onClick={toggleUserProfile}>
            <div className="sidebar-user-info">
              <FiUser size={16} />
              <span>{auth.currentUser?.displayName || 'User Profile'}</span>
            </div>
            {showUserProfile ? <FiChevronUp /> : <FiChevronDown />}
          </div>

          <AnimatePresence>
            {showUserProfile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="sidebar-user-profile"
              >
                <UserProfile />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <h2>Saved Meditations</h2>

      <div className="sidebar-list">
        <AnimatePresence>
          {validMeditations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sidebar-empty"
            >
              <FiImage size={24} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>No meditations yet</p>
              <p>Upload an image to create your first meditation</p>
            </motion.div>
          ) : (
            validMeditations.map((m) => (
              <motion.div
                key={m.id}
                className={`sidebar-item${selectedId === m.id ? " selected" : ""}`}
                onClick={() => onSelect(m.id)}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <img
                  src={m.photoUrl && !m.photoUrl.includes("...")
                    ? m.photoUrl
                    : "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}
                  alt="Meditation"
                  className="sidebar-thumb"
                  onError={(e) => {
                    console.log("Image load error for:", m.photoUrl);
                    e.target.src = "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
                  }}
                  onLoad={() => console.log("Image loaded successfully:", m.id)}
                />
                <div>
                  <div className="sidebar-title">{extractTitle(m.geminiGuidance)}</div>
                  <div className="sidebar-date">
                    <FiCalendar size={12} style={{ marginRight: '4px', opacity: 0.7 }} />
                    {formatDate(m.createdAt || m.timestamp || m.clientTimestamp)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
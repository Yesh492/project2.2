import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/LocalStorageNotice.css';
import { db } from '../firebase';

const LocalStorageNotice = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [firestoreAvailable, setFirestoreAvailable] = useState(!!db);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember that the user dismissed the notice
    localStorage.setItem('storageNoticeDismissed', 'true');
  };

  // Check if the notice was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('storageNoticeDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="local-storage-notice"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="notice-content">
            <div className="notice-icon">{firestoreAvailable ? '✅' : '⚠️'}</div>
            <div className="notice-text">
              <h4>{firestoreAvailable ? 'Dual Storage Mode' : 'Local Storage Mode'}</h4>
              {firestoreAvailable ? (
                <p>Your meditations are being saved to both Firestore and your browser's local storage.
                This ensures your data is available across devices and persists even if you're offline.</p>
              ) : (
                <p>Your meditations are being saved to your browser's local storage only.
                They will persist between sessions but are only available on this device and browser.</p>
              )}
            </div>
            <button className="dismiss-button" onClick={handleDismiss}>×</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocalStorageNotice;

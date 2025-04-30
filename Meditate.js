import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import MainArea from "../components/MainArea";
import MeditationDisplay from "../components/MeditationDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { getMeditationsForUser, getMeditationById } from "../services/dataService";
import { FEATURES } from "../config";

const Meditate = ({ userId, isAuthenticated }) => {
  const [meditations, setMeditations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMeditation, setSelectedMeditation] = useState(null);

  // Fetch meditations when component mounts or userId changes
  useEffect(() => {
    fetchMeditations();
  }, [userId]);

  // Ensure meditations is always an array
  const safeMeditations = Array.isArray(meditations) ? meditations : [];

  const fetchMeditations = async () => {
    try {
      console.log("Fetching meditations for user:", userId);

      // Fetch meditations using our unified data service
      const data = await getMeditationsForUser(userId);
      console.log(`Found ${data.length} meditations`);

      // Log the first meditation for debugging
      if (data.length > 0 && FEATURES.ENABLE_DETAILED_LOGGING) {
        console.log("First meditation:", data[0]);
      }

      setMeditations(data);

      // Select the newest meditation if none is selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        setSelectedMeditation(data[0]);
      }
    } catch (error) {
      console.error("Error fetching meditations:", error);

      // Don't crash the app, just set empty meditations
      setMeditations([]);
    }
  };

  const handleSelect = async (id) => {
    if (id === selectedId) return;

    console.log(`Selecting meditation with ID: ${id}`);
    setSelectedId(id);

    try {
      console.log(`Fetching meditation with ID: ${id}`);

      // Use our unified data service to get the meditation
      const meditation = await getMeditationById(id);

      if (meditation) {
        console.log("Meditation data received:", meditation);
        setSelectedMeditation(meditation);
      } else {
        console.log("No such meditation found!");
        setSelectedMeditation({
          id: id,
          geminiGuidance: "This meditation could not be found. Please try creating a new one.",
          notFound: true
        });
      }
    } catch (error) {
      console.error(`Error fetching meditation with ID ${id}:`, error);

      // Set a placeholder meditation instead of crashing
      setSelectedMeditation({
        id: id,
        geminiGuidance: "There was an error retrieving this meditation. Please try creating a new one.",
        error: true
      });
    }
  };

  const handleNewMeditation = async (meditation) => {
    try {
      if (!meditation || !meditation.id) {
        console.error("Invalid meditation object received:", meditation);
        return;
      }

      console.log("New meditation created:", meditation.id);

      // Check if this meditation already exists in our list
      const existingIndex = safeMeditations.findIndex(m => m.id === meditation.id);

      let updatedMeditations;
      if (existingIndex >= 0) {
        // Update existing meditation
        console.log("Updating existing meditation in list:", meditation.id);
        updatedMeditations = [...safeMeditations];
        updatedMeditations[existingIndex] = meditation;
      } else {
        // Add new meditation to the beginning of the list
        console.log("Adding new meditation to list:", meditation.id);
        updatedMeditations = [meditation, ...safeMeditations];
      }

      // Update the state with the new list
      setMeditations(updatedMeditations);

      // Select the new meditation
      setSelectedId(meditation.id);
      setSelectedMeditation(meditation);

      console.log("Updated meditations list, now contains", updatedMeditations.length, "items");
      console.log("First meditation in list:", updatedMeditations[0]?.id);

      // If offline support is enabled, save to local storage
      if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
        try {
          // Get existing offline meditations
          const offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');

          // Check if we already have this meditation
          const existingIndex = offlineMeditations.findIndex(m => m.id === meditation.id);

          if (existingIndex >= 0) {
            // Update existing meditation
            offlineMeditations[existingIndex] = meditation;
          } else {
            // Add new meditation
            offlineMeditations.unshift(meditation); // Add to beginning of array
          }

          localStorage.setItem('offlineMeditations', JSON.stringify(offlineMeditations));
          console.log('Saved new meditation to offline storage');
        } catch (storageError) {
          console.error('Error saving meditation to offline storage:', storageError);
        }
      }

      // Force a refresh of the meditations list after a short delay
      // This ensures the sidebar is updated even if there was an issue
      setTimeout(() => {
        console.log("Performing delayed fetch of meditations");
        fetchMeditations();
      }, 2000);

    } catch (error) {
      console.error("Error handling new meditation:", error);

      // Fallback to regular fetch
      fetchMeditations();
    }
  };

  return (
    <div className="meditate-page" style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1508672019048-805c876b67e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundBlendMode: 'overlay',
      backgroundColor: 'rgba(245, 247, 250, 0.92)'
    }}>
      <motion.div
        className="app-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Sidebar
          meditations={safeMeditations}
          onSelect={handleSelect}
          selectedId={selectedId}
        />

        <div className="main-content">
          <MainArea
            userId={userId}
            isAuthenticated={isAuthenticated}
            onNewMeditation={handleNewMeditation}
          />

          <AnimatePresence mode="wait">
            {selectedId && selectedMeditation && (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MeditationDisplay meditation={selectedMeditation} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Meditate;

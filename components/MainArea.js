import * as React from "react";
const { useState, useRef, useEffect } = React;
import MeditationDisplay from "./MeditationDisplay";
import { motion, AnimatePresence } from "framer-motion";
import GooglePhotosPicker from "./GooglePhotosPicker";
import { FiCheck, FiImage, FiCamera, FiLogIn } from "react-icons/fi";
import { auth } from "../firebase";
import "../styles/GooglePhotosPicker.css";
import {
  saveMeditation,
  trackImageUpload,
  updateImageAnalysis
} from "../services/dataService";
import {
  analyzeImageWithVision,
  extractEmotions,
  extractDominantColors,
  mapColorsToEmotions,
  generateMeditationWithGemini,
  processImageForAnalysis
} from "../services/aiService";
import { isGooglePhotosUrl, formatGooglePhotosUrl } from "../utils/imageUtils";
import { FEATURES } from "../config";

// Yoga and meditation images for the background
const yogaImages = [
  "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
];

export default function MainArea({ userId, onNewMeditation }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [style, setStyle] = useState("Calm");
  const [theme, setTheme] = useState("Nature");
  const [loading, setLoading] = useState(false);
  const [meditation, setMeditation] = useState(null);
  const [showGooglePhotos, setShowGooglePhotos] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUploadId, setCurrentUploadId] = useState(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const fileInputRef = useRef(null);

  // Check if user is signed in with Google
  useEffect(() => {
    const checkGoogleAuth = () => {
      const user = auth.currentUser;
      if (user) {
        // Check if user is signed in with Google
        const isGoogle = user.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        setIsGoogleUser(isGoogle);

        console.log('User authentication status:', {
          uid: user.uid,
          isGoogleUser: isGoogle,
          displayName: user.displayName,
          email: user.email
        });
      } else {
        setIsGoogleUser(false);
      }
    };

    // Check auth immediately
    checkGoogleAuth();

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // Check if user is signed in with Google
        const isGoogle = user.providerData.some(
          provider => provider.providerId === 'google.com'
        );
        setIsGoogleUser(isGoogle);
      } else {
        setIsGoogleUser(false);
      }
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Hide success message after 5 seconds
  useEffect(() => {
    let timer;
    if (showSuccess) {
      timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showSuccess]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setCurrentUploadId(null);
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image under 5MB.");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    console.log(`Processing file upload: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Track the upload in Firestore
    try {
      // Create an image object to get dimensions
      const img = new Image();
      img.onload = async () => {
        const dimensions = {
          width: img.width,
          height: img.height
        };

        // Track the upload using our unified data service
        const uploadId = await trackImageUpload({
          userId: userId, // Use the actual user ID passed from props
          source: 'device',
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
          dimensions
        });

        if (uploadId) {
          console.log("Upload tracked successfully, ID:", uploadId);
          setCurrentUploadId(uploadId);
        } else {
          console.error("Failed to track upload");
        }
      };

      // Start loading the image to get dimensions
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        console.log("File successfully converted to data URL");
        setPhotoUrl(dataUrl);
        // Close Google Photos picker if it's open
        setShowGooglePhotos(false);

        // Set the image source to get dimensions
        img.src = dataUrl;
      };
      reader.onerror = () => {
        console.error("Error reading file");
        alert("Failed to read the selected file. Please try another file.");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error tracking upload:", error);

      // Continue with the upload even if tracking fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setPhotoUrl(dataUrl);
        setShowGooglePhotos(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photoUrl) {
      alert("Please upload an image from your device or select from Google Photos.");
      return;
    }

    console.log("Analyzing photo...");
    setLoading(true);

    // Set a timeout to ensure we don't get stuck in loading state
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Analysis taking too long, showing fallback message");
        setLoading(false);
        alert("Analysis is taking longer than expected. Please try again or use a different image.");
      }
    }, 30000); // 30 seconds timeout

    try {
      // Check if we have a data URL (from file upload) or a Google Photos URL
      const isDataUrl = photoUrl.startsWith("data:");
      const isGooglePhotosUrl = photoUrl.includes("googleusercontent.com");

      console.log("Is data URL:", isDataUrl);
      console.log("Is Google Photos URL:", isGooglePhotosUrl);

      // Step 1: Process the image for analysis
      let imageSource;

      if (isGooglePhotosUrl) {
        // For Google Photos URLs, we'll try multiple approaches
        try {
          // First, try to process the image through our backend proxy
          console.log("Processing Google Photos URL...");
          const formattedUrl = formatGooglePhotosUrl(photoUrl);

          // Try to use the backend to process the image
          try {
            const processedImage = await processImageForAnalysis(formattedUrl);
            if (processedImage) {
              // If we got base64 data, use it
              imageSource = processedImage;
              console.log("Successfully processed Google Photos URL to base64");
            } else {
              // If we didn't get base64 data, use the URL directly
              imageSource = { url: formattedUrl };
              console.log("Using Google Photos URL directly with Vision API");
            }
          } catch (processingError) {
            console.error("Error processing image:", processingError);
            // Fall back to using the URL directly
            imageSource = { url: formattedUrl };
            console.log("Falling back to using Google Photos URL directly");
          }
        } catch (googlePhotosError) {
          console.error("Error with Google Photos URL:", googlePhotosError);
          // Don't throw an error, just use a fallback approach
          console.log("Using fallback approach for Google Photos URL");
          imageSource = null;
        }
      } else if (isDataUrl) {
        // For data URLs, extract the base64 data
        imageSource = photoUrl.split(',')[1];
        console.log("Extracted base64 data from data URL");
      } else {
        alert("Invalid image source. Please upload an image or select from Google Photos.");
        setLoading(false);
        clearTimeout(loadingTimeout);
        return;
      }

      // Step 2: Analyze the image with Vision API
      console.log("Analyzing image with Vision API...");

      // If we couldn't process the image, use a fallback approach
      if (!imageSource) {
        console.log("No valid image source, using fallback approach");
        // This will use the fallback data in the analyzeImageWithVision function
      }

      const visionResult = await analyzeImageWithVision(imageSource);
      console.log("Vision analysis complete:", visionResult);

      // Step 3: Extract data from Vision API result

      // Extract emotions from all available data
      const emotions = extractEmotions(
        visionResult.faceAnnotations,
        visionResult.labelAnnotations,
        visionResult.localizedObjectAnnotations,
        visionResult.safeSearchAnnotation
      );
      console.log("Extracted emotions:", emotions);

      // Extract labels
      const labels = visionResult.labelAnnotations
        ? visionResult.labelAnnotations.map(label => label.description)
        : ["Nature", "Scenery"]; // Fallback labels
      console.log("Extracted labels:", labels);

      // Extract dominant colors
      const dominantColors = extractDominantColors(visionResult.imagePropertiesAnnotation);
      console.log("Extracted dominant colors:", dominantColors);

      // Extract objects
      const objects = visionResult.localizedObjectAnnotations
        ? visionResult.localizedObjectAnnotations.map(obj => obj.name)
        : [];
      console.log("Extracted objects:", objects);

      // Extract landmarks
      const landmarks = visionResult.landmarkAnnotations
        ? visionResult.landmarkAnnotations.map(landmark => landmark.description)
        : [];
      console.log("Extracted landmarks:", landmarks);

      // Map colors to emotions
      const colorEmotions = mapColorsToEmotions(dominantColors);
      console.log("Color emotions:", colorEmotions);

      // Add timestamp to ensure uniqueness
      const timestamp = new Date().toISOString();
      const randomSeed = Math.random().toString(36).substring(2, 15);

      // Step 4: Generate meditation using Gemini API
      const analysisData = {
        emotions,
        labels,
        dominantColors,
        objects,
        landmarks,
        colorEmotions,
        timestamp,
        randomSeed
      };

      const geminiGuidance = await generateMeditationWithGemini(analysisData, style, theme);
      console.log("Generated meditation:", geminiGuidance);

      // Step 5: Save to Firestore
      console.log("Saving meditation data to Firestore...");

      // Create meditation data object
      const meditationData = {
        userId,
        photoUrl, // Original photo URL - will be truncated in the service
        visionResult: analysisData,
        geminiGuidance,
        style,
        theme,
        timestamp,
        randomSeed,
        uploadId: currentUploadId // Include the upload ID for tracking
      };

      try {
        if (FEATURES.ENABLE_DETAILED_LOGGING) {
          console.log("DETAILED LOGGING: About to save meditation data:", JSON.stringify(meditationData));
        }

        // Save meditation using our unified data service
        const meditationId = await saveMeditation({
          ...meditationData,
          userId: userId // Use the actual user ID passed from props
        });

        if (meditationId) {
          console.log("Meditation saved successfully, ID:", meditationId);
        } else {
          console.error("Failed to save meditation");
          throw new Error("Failed to save meditation");
        }

        console.log("Meditation saved with ID:", meditationId);

        // Create complete meditation object with ID
        const completeMeditation = {
          id: meditationId,
          ...meditationData,
          timestamp: new Date().toISOString(),
          clientTimestamp: Date.now()
        };
        console.log("Created complete meditation object:", completeMeditation.id);

        // Show success message
        setSuccessMessage("Meditation successfully generated and saved!");
        setShowSuccess(true);

        // Set the meditation with the complete data
        setMeditation(completeMeditation);
        console.log("Set meditation state with complete data");

        // Notify parent component to refresh the sidebar
        console.log("Calling onNewMeditation to refresh sidebar with meditation:", completeMeditation.id);
        if (typeof onNewMeditation === 'function') {
          try {
            // Make sure we're passing the complete meditation object with ID
            onNewMeditation({
              ...completeMeditation,
              id: meditationId,
              timestamp: new Date().toISOString(),
              clientTimestamp: Date.now()
            });
            console.log("onNewMeditation called successfully with meditation ID:", meditationId);
          } catch (callbackError) {
            console.error("Error in onNewMeditation callback:", callbackError);
          }
        } else {
          console.warn("onNewMeditation is not a function or not provided");
        }
      } catch (firestoreError) {
        console.error("ERROR SAVING TO FIRESTORE IN MAINAREA:", firestoreError);
        console.error("Error code:", firestoreError.code);
        console.error("Error message:", firestoreError.message);
        console.error("Error stack:", firestoreError.stack);

        // Create a meditation object with a temporary ID
        const tempMeditation = {
          id: "temp-" + Date.now(),
          ...meditationData
        };

        // Still set the meditation data even if Firestore save fails
        setMeditation(tempMeditation);

        // Show a different success message
        setSuccessMessage("Meditation generated but not saved to cloud. You can still view it now.");
        setShowSuccess(true);

        // Notify parent component to refresh the sidebar
        if (typeof onNewMeditation === 'function') {
          try {
            console.log("Calling onNewMeditation with temp meditation:", tempMeditation.id);
            onNewMeditation(tempMeditation);
          } catch (callbackError) {
            console.error("Error in onNewMeditation callback (fallback):", callbackError);
          }
        }
      }
    } catch (e) {
      console.error("Failed to analyze photo:", e);

      // Create a fallback meditation with a generic message
      const fallbackMeditation = {
        id: "fallback-" + Date.now(),
        userId,
        photoUrl,
        uploadId: currentUploadId, // Include the upload ID for tracking
        visionResult: {
          emotions: { joy: "POSSIBLE", calm: "LIKELY" },
          labels: ["Nature", "Scenery"],
          dominantColors: [
            { rgb: { red: 66, green: 133, blue: 244 }, hex: '#4285F4', score: 0.4 },
            { rgb: { red: 52, green: 168, blue: 83 }, hex: '#34A853', score: 0.3 }
          ],
          objects: ["Plant", "Sky"],
          landmarks: [],
          colorEmotions: "Calm, Peace (Blue), Growth, Healing (Green)"
        },
        geminiGuidance: `# Peaceful Nature Meditation

## Step 1: Centering
Take a deep breath and feel your body settling into this moment. Notice the sensations in your body as you begin to relax. Allow your mind to focus on the image of nature before you.

## Step 2: Awareness
Observe the colors and how they create a sense of calm. Let these colors wash over you, bringing their energy into your awareness. Feel yourself becoming more present.

## Step 3: Connection
Imagine yourself within this scene, surrounded by the essence of nature. What sounds might you hear? What textures might you feel? Allow all your senses to engage with this environment.

## Step 4: Embodiment
As you breathe deeply, embody the quality of peace that this image evokes. Let this feeling spread through your entire body, from your toes to the crown of your head.

## Step 5: Integration
Carry this sense of calm with you as you slowly prepare to return to your day. Know that you can return to this feeling whenever you need to reconnect with the essence of nature.`,
        style,
        theme,
        timestamp: new Date().toISOString(),
        randomSeed: Math.random().toString(36).substring(2, 15)
      };

      // Set the fallback meditation
      setMeditation(fallbackMeditation);

      // Show a success message anyway
      setSuccessMessage("Meditation generated with default settings.");
      setShowSuccess(true);

      // Notify parent component to refresh the sidebar
      if (typeof onNewMeditation === 'function') {
        try {
          console.log("Calling onNewMeditation with fallback meditation:", fallbackMeditation.id);
          onNewMeditation(fallbackMeditation);
        } catch (callbackError) {
          console.error("Error in onNewMeditation callback (error fallback):", callbackError);
        }
      }

      // Show a non-blocking alert
      console.warn("Using fallback meditation due to error:", e.message);
    } finally {
      setLoading(false);
      clearTimeout(loadingTimeout);
    }
  };

  return (
    <main className="main-area">
      <motion.div className="main-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2>Create Your Meditation</h2>

        {photoUrl && photoUrl.startsWith('data:') && (
          <div style={{
            marginBottom: '1.5rem',
            width: '100%',
            textAlign: 'center',
            position: 'relative'
          }}>
            <img
              src={photoUrl}
              alt="Selected"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid white'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              padding: '5px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }} onClick={() => {
              setPhotoUrl("");
              setCurrentUploadId(null);
            }}>
              ✕
            </div>
          </div>
        )}

        <div className="main-controls">
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            className="upload-btn"
            type="button"
            onClick={() => fileInputRef.current.click()}
          >
            <FiImage style={{ marginRight: '8px' }} /> Upload from Device
          </button>

          {isGoogleUser ? (
            <button
              className="google-photos-btn"
              type="button"
              onClick={() => setShowGooglePhotos(true)}
            >
              <FiCamera style={{ marginRight: '8px' }} /> {showGooglePhotos ? "Choose a Photo" : "Google Photos"}
            </button>
          ) : (
            <button
              className="google-photos-btn google-photos-signin-btn"
              type="button"
              onClick={() => window.location.href = '/signin'}
            >
              <FiLogIn style={{ marginRight: '8px' }} /> Sign in with Google for Photos
            </button>
          )}
        </div>

        <div className="main-dropdowns-row">
          <label>
            Meditation Style
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option>Calm</option>
              <option>Energetic</option>
              <option>Healing</option>
              <option>Mindful</option>
              <option>Spiritual</option>
            </select>
          </label>
          <label>
            Meditation Theme
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option>Nature</option>
              <option>Focus</option>
              <option>Relaxation</option>
              <option>Gratitude</option>
              <option>Stress Relief</option>
            </select>
          </label>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <FiCheck style={{ marginRight: '8px' }} /> {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="generate-btn"
          onClick={handleAnalyze}
          disabled={loading || !photoUrl}
        >
          {loading ? "Generating Your Meditation..." : "Generate Meditation"}
        </button>
      </motion.div>

      <div className={`google-photos-wrapper ${showGooglePhotos ? 'active' : ''}`}>
        <GooglePhotosPicker
          onPhotoSelected={async (url) => {
            console.log("Photo selected from Google Photos:", url);

            // Store the URL
            setPhotoUrl(url);

            // Create a new Image object to preload the image
            const img = new Image();
            img.crossOrigin = "anonymous";

            // Set up event handlers
            img.onload = async () => {
              console.log("Image preloaded successfully");

              try {
                // Track the upload in Firestore
                const dimensions = {
                  width: img.width,
                  height: img.height
                };

                const uploadId = await trackImageUpload({
                  userId: userId, // Use the actual user ID passed from props
                  source: 'google_photos',
                  fileType: 'image/jpeg', // Assume JPEG for Google Photos
                  fileName: url.split('/').pop() || 'google-photo',
                  fileSize: 0, // We don't know the file size
                  dimensions
                });

                if (uploadId) {
                  console.log("Google Photos upload tracked with ID:", uploadId);
                  setCurrentUploadId(uploadId);
                }
              } catch (error) {
                console.error("Error tracking Google Photos upload:", error);
                // Continue even if tracking fails
              }

              // Close the picker
              setShowGooglePhotos(false);

              // We'll let the user click the Generate button manually
              // instead of automatically triggering analysis
            };

            img.onerror = (error) => {
              console.error("Error preloading image:", error);

              // Try to track the upload anyway
              try {
                trackImageUpload({
                  userId: userId, // Use the actual user ID passed from props
                  source: 'google_photos',
                  fileType: 'image/jpeg',
                  fileName: url.split('/').pop() || 'google-photo',
                  fileSize: 0,
                  dimensions: { width: 0, height: 0 }
                }).then(uploadId => {
                  if (uploadId) {
                    console.log("Google Photos upload tracked with ID (from error handler):", uploadId);
                    setCurrentUploadId(uploadId);
                  }
                });
              } catch (trackError) {
                console.error("Error tracking Google Photos upload in error handler:", trackError);
              }

              // Close the picker anyway
              setShowGooglePhotos(false);

              // We'll let the user click the Generate button manually
              // instead of automatically triggering analysis
            };

            // Start loading the image
            img.src = url;
          }}
        />
      </div>

      {meditation && <MeditationDisplay meditation={meditation} />}
    </main>
  );
}

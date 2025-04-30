// dataService.js - Unified data service that uses Firestore directly

import axios from 'axios';
import { API_CONFIG, FEATURES, DEFAULTS } from '../config';
import * as firebaseService from './firebaseService';

// Create axios instance with base URL for backend API calls (if needed)
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// No mock API response handler needed - using mock data service directly

// Add request interceptor for logging
api.interceptors.request.use(
  async config => {
    if (FEATURES.ENABLE_DETAILED_LOGGING) {
      console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  error => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    if (FEATURES.ENABLE_DETAILED_LOGGING) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async error => {
    console.error('❌ API Response Error:', error);
    return Promise.reject(error);
  }
);

// Get current user ID (for now, just return the default)
const getCurrentUserId = () => {
  return DEFAULTS.DEFAULT_USER_ID;
};

// Save a meditation
export const saveMeditation = async (meditationData) => {
  try {
    const userId = getCurrentUserId();
    console.log('Saving meditation for user:', userId);

    // Add user ID if not provided
    if (!meditationData.userId) {
      meditationData.userId = userId;
    }

    // Add timestamp if not provided
    if (!meditationData.clientTimestamp) {
      meditationData.clientTimestamp = Date.now();
    }

    // Add default style and theme if not provided
    if (!meditationData.style) {
      meditationData.style = DEFAULTS.DEFAULT_STYLE;
    }

    if (!meditationData.theme) {
      meditationData.theme = DEFAULTS.DEFAULT_THEME;
    }

    // Use firebaseService to save the meditation directly to Firestore
    const meditationId = await firebaseService.saveMeditation(meditationData);
    console.log('Meditation saved successfully with ID:', meditationId);
    return meditationId;
  } catch (error) {
    console.error('Error saving meditation:', error);
    return saveOfflineMeditation(meditationData);
  }
};

// Helper function to save meditation offline
const saveOfflineMeditation = (meditationData) => {
  if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
    try {
      const timestamp = Date.now();
      const offlineId = `offline-meditation-${timestamp}`;

      // Create a complete meditation object
      const completeMeditation = {
        ...meditationData,
        id: offlineId,
        timestamp: new Date().toISOString(),
        clientTimestamp: timestamp,
        offline: true
      };

      // Add to offline meditations
      const offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');
      offlineMeditations.unshift(completeMeditation); // Add to beginning of array
      localStorage.setItem('offlineMeditations', JSON.stringify(offlineMeditations));

      // Add to offline queue for later sync
      const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      offlineQueue.push({
        type: 'saveMeditation',
        data: meditationData,
        timestamp
      });

      localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
      console.log('Meditation saved to offline queue with ID:', offlineId);

      return offlineId;
    } catch (offlineError) {
      console.error('Error saving to offline queue:', offlineError);

      // Last resort fallback
      return `offline-meditation-${Date.now()}-fallback`;
    }
  }

  // If offline support is disabled, return a dummy ID
  return `offline-meditation-${Date.now()}-dummy`;
};

// Track image upload
export const trackImageUpload = async (imageData) => {
  try {
    const userId = getCurrentUserId();
    console.log('Tracking image upload for user:', userId);

    // Add user ID if not provided
    if (!imageData.userId) {
      imageData.userId = userId;
    }

    // Add timestamp if not provided
    if (!imageData.clientUploadTime) {
      imageData.clientUploadTime = Date.now();
    }

    // Use firebaseService to track image upload directly in Firestore
    const uploadId = await firebaseService.trackImageUpload(imageData);
    console.log('Image upload tracked successfully with ID:', uploadId);
    return uploadId;
  } catch (error) {
    console.error('Error tracking image upload:', error);

    // If offline support is enabled, save to local storage
    if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
      try {
        const timestamp = Date.now();
        const offlineId = `offline-upload-${timestamp}`;

        // Add to offline queue
        const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        offlineQueue.push({
          type: 'trackImageUpload',
          data: imageData,
          timestamp
        });

        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
        console.log('Image upload tracked in offline queue with ID:', offlineId);

        return offlineId;
      } catch (offlineError) {
        console.error('Error saving to offline queue:', offlineError);
      }
    }

    throw error;
  }
};

// Update image analysis
export const updateImageAnalysis = async (uploadId, analysisData) => {
  try {
    if (!uploadId) {
      console.error('No upload ID provided for analysis update');
      return false;
    }

    console.log('Updating image analysis for upload ID:', uploadId);

    // Add timestamp if not provided
    if (!analysisData.clientAnalysisTime) {
      analysisData.clientAnalysisTime = Date.now();
    }

    // Use firebaseService to update image analysis directly in Firestore
    const success = await firebaseService.updateImageAnalysis(uploadId, analysisData);
    if (success) {
      console.log('Image analysis updated successfully');
      return true;
    } else {
      throw new Error('Failed to update image analysis');
    }
  } catch (error) {
    console.error('Error updating image analysis:', error);

    // If offline support is enabled, save to local storage
    if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
      try {
        // Add to offline queue
        const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        offlineQueue.push({
          type: 'updateImageAnalysis',
          uploadId,
          data: analysisData,
          timestamp: Date.now()
        });

        localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
        console.log('Image analysis update added to offline queue');

        return true;
      } catch (offlineError) {
        console.error('Error saving to offline queue:', offlineError);
      }
    }

    return false;
  }
};

// Get meditations for a user
export const getMeditationsForUser = async (userId = null) => {
  try {
    const actualUserId = userId || getCurrentUserId();
    console.log('Fetching meditations for user:', actualUserId);

    // Get offline meditations first
    let offlineMeditations = [];
    if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
      try {
        offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');
        console.log(`Found ${offlineMeditations.length} offline meditations`);
      } catch (offlineError) {
        console.error('Error getting offline meditations:', offlineError);
      }
    }

    // Use firebaseService to get meditations directly from Firestore
    try {
      const onlineMeditations = await firebaseService.getMeditationsForUser(actualUserId);
      console.log(`Found ${onlineMeditations.length} online meditations`);

      // Merge online and offline meditations, removing duplicates
      const onlineIds = new Set(onlineMeditations.map(m => m.id));
      const uniqueOfflineMeditations = offlineMeditations.filter(m => !onlineIds.has(m.id));

      const allMeditations = [...onlineMeditations, ...uniqueOfflineMeditations];

      // Sort by timestamp (newest first)
      allMeditations.sort((a, b) => {
        const timeA = a.clientTimestamp || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
        const timeB = b.clientTimestamp || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
        return timeB - timeA;
      });

      console.log(`Returning ${allMeditations.length} total meditations (${onlineMeditations.length} online + ${uniqueOfflineMeditations.length} offline)`);
      return allMeditations;
    } catch (apiError) {
      console.error('Error fetching online meditations:', apiError);
      return offlineMeditations;
    }
  } catch (error) {
    console.error('Error in getMeditationsForUser:', error);

    // Last resort fallback
    if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
      try {
        const offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');
        return offlineMeditations;
      } catch (fallbackError) {
        console.error('Error in fallback for getMeditationsForUser:', fallbackError);
      }
    }

    return [];
  }
};

// Get a single meditation by ID
export const getMeditationById = async (meditationId) => {
  try {
    if (!meditationId) {
      console.error('No meditation ID provided');
      return null;
    }

    console.log('Fetching meditation by ID:', meditationId);

    // Check if it's an offline ID or if we have it in offline storage
    if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
      // Get offline meditations
      const offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');
      const offlineMeditation = offlineMeditations.find(m => m.id === meditationId);

      if (offlineMeditation) {
        console.log('Found meditation in offline storage:', meditationId);
        return offlineMeditation;
      }

      // If it's an offline ID but not found in storage, return a placeholder
      if (meditationId.startsWith('offline-')) {
        console.log('Offline meditation ID not found in storage:', meditationId);
        return {
          id: meditationId,
          geminiGuidance: "# Meditation Not Found\n\nThis meditation could not be found in your offline storage. It may have been deleted or the storage may have been cleared.",
          notFound: true,
          offline: true
        };
      }
    }

    // Use firebaseService to get meditation directly from Firestore
    try {
      const meditation = await firebaseService.getMeditationById(meditationId);

      if (meditation) {
        console.log('Meditation fetched successfully from Firestore:', meditationId);

        // If offline support is enabled, save to local storage for future offline access
        if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
          try {
            const offlineMeditations = JSON.parse(localStorage.getItem('offlineMeditations') || '[]');

            // Check if we already have this meditation
            const existingIndex = offlineMeditations.findIndex(m => m.id === meditationId);

            if (existingIndex >= 0) {
              // Update existing meditation
              offlineMeditations[existingIndex] = meditation;
            } else {
              // Add new meditation
              offlineMeditations.push(meditation);
            }

            localStorage.setItem('offlineMeditations', JSON.stringify(offlineMeditations));
            console.log('Saved meditation to offline storage for future access');
          } catch (storageError) {
            console.error('Error saving meditation to offline storage:', storageError);
          }
        }

        return meditation;
      } else {
        // Return a placeholder for not found
        return {
          id: meditationId,
          geminiGuidance: "# Meditation Not Found\n\nThis meditation could not be found in the database. It may have been deleted or may not exist.",
          notFound: true
        };
      }
    } catch (apiError) {
      console.error('Error fetching meditation from Firestore:', apiError);

      // Return a placeholder for not found
      return {
        id: meditationId,
        geminiGuidance: "# Meditation Not Found\n\nThis meditation could not be found. It may have been deleted or may not exist.",
        notFound: true
      };
    }
  } catch (error) {
    console.error('Error in getMeditationById:', error);

    // Return a placeholder for error
    return {
      id: meditationId,
      geminiGuidance: "# Error\n\nThere was an error retrieving this meditation. Please try again later.",
      error: true
    };
  }
};

// Get recent uploads for a user
export const getRecentUploads = async (userId = null, maxLimit = 10) => {
  try {
    const actualUserId = userId || getCurrentUserId();
    console.log(`Fetching recent uploads for user: ${actualUserId}, limit: ${maxLimit}`);

    // Use firebaseService to get recent uploads directly from Firestore
    try {
      const uploads = await firebaseService.getRecentUploads(actualUserId, maxLimit);
      console.log(`Found ${uploads.length} recent uploads`);
      return uploads;
    } catch (apiError) {
      console.error('Error fetching recent uploads from Firestore:', apiError);

      // If offline support is enabled, get from local storage
      if (FEATURES.ENABLE_OFFLINE_SUPPORT) {
        try {
          // Get offline uploads
          const offlineUploads = JSON.parse(localStorage.getItem('offlineUploads') || '[]');
          console.log(`Found ${offlineUploads.length} offline uploads`);
          return offlineUploads;
        } catch (offlineError) {
          console.error('Error getting offline uploads:', offlineError);
        }
      }

      return [];
    }
  } catch (error) {
    console.error('Error in getRecentUploads:', error);
    return [];
  }
};

// Process offline queue
export const processOfflineQueue = async () => {
  if (!FEATURES.ENABLE_OFFLINE_SUPPORT) {
    return;
  }

  try {
    // Get offline queue
    const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');

    if (offlineQueue.length === 0) {
      console.log('No offline queue to process');
      return;
    }

    console.log(`Processing offline queue with ${offlineQueue.length} items`);

    // Process each item in the queue
    const newQueue = [];

    for (const item of offlineQueue) {
      try {
        switch (item.type) {
          case 'saveMeditation':
            await api.post(API_CONFIG.FIRESTORE.MEDITATIONS, item.data);
            break;
          case 'trackImageUpload':
            await api.post(API_CONFIG.FIRESTORE.IMAGE_UPLOADS, item.data);
            break;
          case 'updateImageAnalysis':
            await api.patch(`${API_CONFIG.FIRESTORE.IMAGE_UPLOADS}/${item.uploadId}`, item.data);
            break;
          default:
            console.warn('Unknown offline queue item type:', item.type);
            newQueue.push(item);
        }
      } catch (error) {
        console.error(`Error processing offline queue item of type ${item.type}:`, error);
        newQueue.push(item);
      }
    }

    // Save the new queue
    localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
    console.log(`Processed offline queue, ${offlineQueue.length - newQueue.length} items processed, ${newQueue.length} items remaining`);
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

// Check connection status
export const checkConnectionStatus = async () => {
  try {
    // Try to make a simple API call to check connection
    await api.get('/api/health');

    // If successful, process offline queue
    await processOfflineQueue();

    return {
      isConnected: true,
      isAuthenticated: true,
      userId: getCurrentUserId()
    };
  } catch (error) {
    console.error('Connection check failed:', error);

    return {
      isConnected: false,
      isAuthenticated: false,
      userId: getCurrentUserId()
    };
  }
};

// Export all functions
export default {
  saveMeditation,
  trackImageUpload,
  updateImageAnalysis,
  getMeditationsForUser,
  getMeditationById,
  getRecentUploads,
  processOfflineQueue,
  checkConnectionStatus
};

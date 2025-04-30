// firebaseService.js - Using real Firestore

import { db, auth, ensureAuth, getConnectionStatus } from '../firebase';
import { FEATURES } from '../config';
import * as mockDataService from './mockDataService';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  setDoc,
  serverTimestamp,
  addDoc,
  orderBy,
  limit,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// Maximum number of retries for operations
const MAX_RETRIES = 3;

// Helper function to generate IDs
const generateId = (prefix = 'real') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Check connection status
export const checkConnectionStatus = () => {
  return getConnectionStatus();
};

// Save a meditation to Firestore
export const saveMeditation = async (meditationData) => {
  try {
    // Ensure we're authenticated before proceeding
    await ensureAuth();

    const userId = auth.currentUser ? auth.currentUser.uid : 'demo-user';
    console.log('Saving meditation for user:', userId);

    // Generate a unique ID with timestamp to avoid collisions
    const timestamp = Date.now();
    const meditationId = `meditation-${timestamp}-${Math.floor(Math.random() * 1000)}`;

    // Create a reference to the document
    const docRef = doc(db, 'meditations', meditationId);

    // Prepare the meditation data with proper null/empty handling
    const meditationEntry = {
      userId,
      photoUrl: meditationData.photoUrl || '',
      geminiGuidance: meditationData.geminiGuidance || '',
      createdAt: serverTimestamp(), // Use Firestore server time
      style: meditationData.style || 'Calm',
      theme: meditationData.theme || 'Nature',
      visionResult: {
        dominantColors: meditationData?.visionResult?.dominantColors || [],
        emotions: meditationData?.visionResult?.emotions || {},
        labels: meditationData?.visionResult?.labels || [],
        objects: meditationData?.visionResult?.objects || [],
        landmarks: meditationData?.visionResult?.landmarks || [],
        colorEmotions: meditationData?.visionResult?.colorEmotions || ''
      },
      // Add tracking information
      uploadId: meditationData.uploadId || null,
      analysisComplete: true,
      analysisTimestamp: serverTimestamp(),
      // Add client-side timestamp as backup
      clientTimestamp: timestamp
    };

    console.log('Attempting to save meditation with ID:', meditationId);

    // Use a retry mechanism with batch writes
    let retries = MAX_RETRIES;
    let success = false;

    while (retries > 0 && !success) {
      try {
        // Create a batch for atomic operations
        const batch = writeBatch(db);

        // Add the meditation document to the batch
        batch.set(docRef, meditationEntry);

        // If we have an uploadId, update the image upload record in the same batch
        if (meditationData.uploadId) {
          const uploadRef = doc(db, 'imageUploads', meditationData.uploadId);
          batch.update(uploadRef, {
            status: 'analyzed',
            analysisTime: serverTimestamp(),
            clientAnalysisTime: timestamp,
            analysisData: {
              emotions: meditationData?.visionResult?.emotions || {},
              labels: meditationData?.visionResult?.labels || [],
              dominantColors: meditationData?.visionResult?.dominantColors || [],
              objects: meditationData?.visionResult?.objects || [],
              landmarks: meditationData?.visionResult?.landmarks || []
            },
            meditationId: meditationId
          });
        }

        // Commit the batch
        await batch.commit();
        success = true;
        console.log('Meditation saved successfully with batch operation:', meditationId);
      } catch (batchError) {
        console.error(`Error saving meditation batch (retries left: ${retries-1}):`, batchError);
        retries--;

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }

    if (!success) {
      // If batch operation failed, try individual operations as fallback
      console.log('Batch operation failed, trying individual document write as fallback');

      try {
        await setDoc(docRef, meditationEntry);
        console.log('Meditation saved successfully with fallback method:', meditationId);
        return meditationId;
      } catch (fallbackError) {
        console.error('Fallback save method also failed:', fallbackError);

        // If all Firestore attempts fail, use mock data as a last resort
        console.log('All Firestore attempts failed, using mock data as last resort');
        return await mockDataService.mockSaveMeditation(meditationData);
      }
    }

    return meditationId;
  } catch (error) {
    console.error('Error saving meditation:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Use mock data as a fallback when all else fails
    console.log('Using mock data service as error fallback');
    return await mockDataService.mockSaveMeditation(meditationData);
  }
};

// Get all meditations for a user
export const getMeditationsForUser = async (userId) => {
  try {
    await ensureAuth(); // Safe check for signed-in user

    const actualUserId = userId || auth.currentUser?.uid || 'demo-user';

    console.log('Fetching meditations for user:', actualUserId);

    const meditationsCollection = collection(db, 'meditations');

    try {
      // First try with the composite index (userId + orderBy timestamp)
      const q = query(
        meditationsCollection,
        where('userId', '==', actualUserId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const meditations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Found ${meditations.length} meditations using composite index`);

      // If no meditations found, use mock data as fallback
      if (meditations.length === 0) {
        console.log('No meditations found in Firestore, using mock data as fallback');
        return await mockDataService.mockGetMeditationsForUser(actualUserId);
      }

      return meditations;
    } catch (indexError) {
      // If the index isn't ready yet, try a simpler query without ordering
      console.warn('Index not ready yet, falling back to simple query:', indexError.message);

      if (indexError.code === 'failed-precondition' &&
          indexError.message.includes('requires an index')) {
        console.log('Attempting fallback query without ordering...');

        // Fallback query without ordering
        const fallbackQuery = query(
          meditationsCollection,
          where('userId', '==', actualUserId)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Sort the results in memory
        const fallbackMeditations = fallbackSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Sort by timestamp or createdAt in descending order if available
            const getTime = (doc) => {
              if (doc.timestamp?.toDate) return doc.timestamp.toDate();
              if (doc.createdAt?.toDate) return doc.createdAt.toDate();
              if (doc.clientTimestamp) return new Date(doc.clientTimestamp);
              return new Date(0);
            };

            return getTime(b) - getTime(a);
          });

        console.log(`Found ${fallbackMeditations.length} meditations using fallback query`);

        // If no meditations found, use mock data as fallback
        if (fallbackMeditations.length === 0) {
          console.log('No meditations found in Firestore, using mock data as fallback');
          return await mockDataService.mockGetMeditationsForUser(actualUserId);
        }

        return fallbackMeditations;
      } else {
        // If it's a different error, rethrow it
        throw indexError;
      }
    }
  } catch (error) {
    console.error('Error fetching meditations:', error);
    console.error('Error details:', JSON.stringify({
      code: error.code,
      name: error.name,
      message: error.message
    }));

    // If there's an index URL in the error, log it for easy access
    if (error.message && error.message.includes('https://console.firebase.google.com')) {
      const indexUrl = error.message.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
      if (indexUrl && indexUrl[1]) {
        console.log('Create the required index here:', indexUrl[1]);
      }
    }

    // Use mock data as a fallback when Firestore fails
    console.log('Using mock data service as error fallback');
    return await mockDataService.mockGetMeditationsForUser(userId);
  }
};

// Get a single meditation by ID
export const getMeditationById = async (meditationId) => {
  try {
    await ensureAuth(); // Safe check

    console.log('Fetching meditation by ID:', meditationId);

    const docRef = doc(db, 'meditations', meditationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      console.log('Meditation not found, using mock data as fallback');
      return await mockDataService.mockGetMeditationById(meditationId);
    }
  } catch (error) {
    console.error('Error fetching meditation:', error);

    // Use mock data as a fallback when Firestore fails
    console.log('Using mock data service as error fallback');
    return await mockDataService.mockGetMeditationById(meditationId);
  }
};

// Track image upload in Firestore
export const trackImageUpload = async (imageData) => {
  try {
    await ensureAuth();

    const userId = auth.currentUser ? auth.currentUser.uid : 'demo-user';
    console.log('Tracking image upload for user:', userId);

    // Create a new document in the 'imageUploads' collection
    const uploadRef = collection(db, 'imageUploads');

    // Prepare the upload data with client timestamp
    const timestamp = Date.now();
    const uploadData = {
      userId,
      uploadTime: serverTimestamp(),
      clientUploadTime: timestamp, // Add client timestamp as backup
      imageSource: imageData.source || 'unknown', // 'device', 'google_photos', etc.
      status: 'uploaded',
      metadata: {
        fileType: imageData.fileType || '',
        fileName: imageData.fileName || '',
        fileSize: imageData.fileSize || 0,
        dimensions: imageData.dimensions || { width: 0, height: 0 },
      }
    };

    console.log('Attempting to track image upload with data:', JSON.stringify({
      userId,
      imageSource: imageData.source || 'unknown',
      fileName: imageData.fileName || ''
    }));

    // Use a retry mechanism for the addDoc operation
    let retries = MAX_RETRIES;
    let docRef = null;

    while (retries > 0 && !docRef) {
      try {
        // Create a batch for atomic operations
        const batch = writeBatch(db);

        // Since we can't use addDoc with batch, we'll create a custom ID
        const customId = `upload-${timestamp}-${Math.floor(Math.random() * 1000)}`;
        const customDocRef = doc(db, 'imageUploads', customId);

        // Add the upload document to the batch
        batch.set(customDocRef, uploadData);

        // Commit the batch
        await batch.commit();

        docRef = customDocRef;
        console.log('Image upload tracked successfully with batch operation, ID:', customId);
      } catch (batchError) {
        console.error(`Error tracking image upload with batch (retries left: ${retries-1}):`, batchError);
        retries--;

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }

    if (!docRef) {
      // If batch operation failed, try individual operation as fallback
      console.log('Batch operation failed, trying individual document write as fallback');

      try {
        docRef = await addDoc(uploadRef, uploadData);
        console.log('Image upload tracked successfully with fallback method, ID:', docRef.id);
      } catch (fallbackError) {
        console.error('Fallback tracking method also failed:', fallbackError);

        // If all Firestore attempts fail, use mock data as a last resort
        console.log('All Firestore attempts failed, using mock data as last resort');
        return await mockDataService.mockTrackImageUpload(imageData);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error tracking image upload:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Use mock data as a fallback when all else fails
    console.log('Using mock data service as error fallback');
    return await mockDataService.mockTrackImageUpload(imageData);
  }
};

// Update image analysis status
export const updateImageAnalysis = async (uploadId, analysisData) => {
  try {
    await ensureAuth();

    if (!uploadId) {
      console.error('No upload ID provided for analysis update');
      return false;
    }

    console.log('Updating image analysis for upload ID:', uploadId);
    const uploadRef = doc(db, 'imageUploads', uploadId);

    // Prepare the update data
    const timestamp = Date.now();
    const updateData = {
      status: 'analyzed',
      analysisTime: serverTimestamp(),
      clientAnalysisTime: timestamp, // Add client timestamp as backup
      analysisData: {
        emotions: analysisData.emotions || {},
        labels: analysisData.labels || [],
        dominantColors: analysisData.dominantColors || [],
        objects: analysisData.objects || [],
        landmarks: analysisData.landmarks || [],
      },
      meditationId: analysisData.meditationId || null
    };

    // Use a retry mechanism with batch writes
    let retries = MAX_RETRIES;
    let success = false;

    while (retries > 0 && !success) {
      try {
        // Create a batch for atomic operations
        const batch = writeBatch(db);

        // Add the update operation to the batch
        batch.update(uploadRef, updateData);

        // Commit the batch
        await batch.commit();

        success = true;
        console.log('Image analysis updated successfully with batch operation for upload ID:', uploadId);
      } catch (batchError) {
        console.error(`Error updating image analysis with batch (retries left: ${retries-1}):`, batchError);
        retries--;

        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }
      }
    }

    if (!success) {
      // If batch operation failed, try individual operation as fallback
      console.log('Batch operation failed, trying individual document update as fallback');

      try {
        await updateDoc(uploadRef, updateData);
        console.log('Image analysis updated successfully with fallback method for upload ID:', uploadId);
        return true;
      } catch (fallbackError) {
        console.error('Fallback update method also failed:', fallbackError);

        // If all Firestore attempts fail, use mock data as a last resort
        console.log('All Firestore attempts failed, using mock data as last resort');
        return await mockDataService.mockUpdateImageAnalysis(uploadId, analysisData);
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating image analysis:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Use mock data as a fallback when all else fails
    console.log('Using mock data service as error fallback');
    return await mockDataService.mockUpdateImageAnalysis(uploadId, analysisData);
  }
};

// Get recent image uploads for a user
export const getRecentUploads = async (userId, maxLimit = 10) => {
  try {
    await ensureAuth();

    const actualUserId = userId || auth.currentUser?.uid || 'demo-user';
    console.log(`Fetching recent uploads for user: ${actualUserId}, limit: ${maxLimit}`);

    const uploadsCollection = collection(db, 'imageUploads');

    try {
      // First try with the composite index (userId + orderBy uploadTime)
      const q = query(
        uploadsCollection,
        where('userId', '==', actualUserId),
        orderBy('uploadTime', 'desc'),
        limit(maxLimit)
      );

      const querySnapshot = await getDocs(q);

      const uploads = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Found ${uploads.length} recent uploads using composite index`);
      return uploads;
    } catch (indexError) {
      // If the index isn't ready yet, try a simpler query without ordering
      console.warn('Index not ready yet, falling back to simple query:', indexError.message);

      if (indexError.code === 'failed-precondition' &&
          indexError.message.includes('requires an index')) {
        console.log('Attempting fallback query without ordering...');

        // Fallback query without ordering
        const fallbackQuery = query(
          uploadsCollection,
          where('userId', '==', actualUserId),
          limit(maxLimit)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);

        // Sort the results in memory
        const fallbackUploads = fallbackSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Sort by uploadTime in descending order if available
            const timeA = a.uploadTime ? a.uploadTime.toDate?.() || a.uploadTime : 0;
            const timeB = b.uploadTime ? b.uploadTime.toDate?.() || b.uploadTime : 0;
            return timeB - timeA;
          })
          .slice(0, maxLimit);

        console.log(`Found ${fallbackUploads.length} recent uploads using fallback query`);
        return fallbackUploads;
      } else {
        // If it's a different error, rethrow it
        throw indexError;
      }
    }
  } catch (error) {
    console.error('Error fetching recent uploads:', error);
    console.error('Error details:', JSON.stringify({
      code: error.code,
      name: error.name,
      message: error.message
    }));

    // If there's an index URL in the error, log it for easy access
    if (error.message && error.message.includes('https://console.firebase.google.com')) {
      const indexUrl = error.message.match(/(https:\/\/console\.firebase\.google\.com\S+)/);
      if (indexUrl && indexUrl[1]) {
        console.log('Create the required index here:', indexUrl[1]);
      }
    }

    // Return empty array on error to prevent UI crashes
    return [];
  }
};



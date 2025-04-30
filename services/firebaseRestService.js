// firebaseRestService.js - Uses Firebase REST API instead of SDK

import { auth } from '../firebase';

// Firebase project configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD92YfQLNuid_T2mIau9uMReNeuCvuWkyc",
  projectId: "energia-efaa2",
};

// Base URLs for Firebase REST APIs
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Get the current user's ID token for authentication
const getIdToken = async () => {
  if (!auth.currentUser) {
    console.error('No authenticated user found');
    return null;
  }

  try {
    // Try to get a fresh token with force refresh
    return await auth.currentUser.getIdToken(true);
  } catch (error) {
    console.error('Error getting ID token:', error);

    // If we can't get a token, use the API key as a fallback
    // This is less secure but will work for development
    console.log('Using API key as fallback authentication');
    return FIREBASE_CONFIG.apiKey;
  }
};

// Helper function to convert Firestore document to JSON
const firestoreToJson = (firestoreDoc) => {
  if (!firestoreDoc || !firestoreDoc.fields) {
    return null;
  }

  const result = {};

  for (const [key, value] of Object.entries(firestoreDoc.fields)) {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue, 10);
    } else if (value.doubleValue !== undefined) {
      result[key] = value.doubleValue;
    } else if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      result[key] = new Date(value.timestampValue);
    } else if (value.arrayValue !== undefined) {
      result[key] = value.arrayValue.values ? value.arrayValue.values.map(v => firestoreToJson({ fields: { value: v } }).value) : [];
    } else if (value.mapValue !== undefined) {
      result[key] = firestoreToJson(value.mapValue);
    } else if (value.nullValue !== undefined) {
      result[key] = null;
    }
  }

  return result;
};

// Helper function to convert JSON to Firestore document
const jsonToFirestore = (json) => {
  if (json === null || json === undefined) {
    return { nullValue: null };
  }

  if (typeof json === 'string') {
    return { stringValue: json };
  }

  if (typeof json === 'number') {
    if (Number.isInteger(json)) {
      return { integerValue: json.toString() };
    }
    return { doubleValue: json };
  }

  if (typeof json === 'boolean') {
    return { booleanValue: json };
  }

  if (json instanceof Date) {
    return { timestampValue: json.toISOString() };
  }

  if (Array.isArray(json)) {
    return {
      arrayValue: {
        values: json.map(item => jsonToFirestore(item))
      }
    };
  }

  if (typeof json === 'object') {
    const fields = {};

    for (const [key, value] of Object.entries(json)) {
      fields[key] = jsonToFirestore(value);
    }

    return {
      mapValue: {
        fields
      }
    };
  }

  return { nullValue: null };
};

// Save a meditation using REST API
export const saveMeditationRest = async (meditationData) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : 'demo-user';
    console.log('Saving meditation for user (REST API):', userId);

    // Generate a unique ID with timestamp to avoid collisions
    const timestamp = Date.now();
    const meditationId = `meditation-${timestamp}-${Math.floor(Math.random() * 1000)}`;

    // Prepare the meditation data
    const meditationEntry = {
      userId,
      photoUrl: meditationData.photoUrl || '',
      geminiGuidance: meditationData.geminiGuidance || '',
      createdAt: new Date().toISOString(),
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
      uploadId: meditationData.uploadId || null,
      analysisComplete: true,
      analysisTimestamp: new Date().toISOString(),
      clientTimestamp: timestamp
    };

    // Convert to Firestore format
    const firestoreData = {
      fields: {}
    };

    for (const [key, value] of Object.entries(meditationEntry)) {
      firestoreData.fields[key] = jsonToFirestore(value);
    }

    console.log('Attempting to save meditation with REST API, ID:', meditationId);

    // Get the ID token for authentication
    const idToken = await getIdToken();

    // Prepare the URL and headers
    let url = `${FIRESTORE_BASE_URL}/meditations/${meditationId}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      url = `${url}?key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API call to:', url);

    // Make the REST API call
    const response = await fetch(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(firestoreData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firestore REST API error:', errorData);
      throw new Error(`Firestore REST API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Meditation saved successfully with REST API:', responseData);

    // If we have an uploadId, update the image upload record
    if (meditationData.uploadId) {
      try {
        await updateImageAnalysisRest(meditationData.uploadId, {
          meditationId,
          emotions: meditationData?.visionResult?.emotions || {},
          labels: meditationData?.visionResult?.labels || [],
          dominantColors: meditationData?.visionResult?.dominantColors || [],
          objects: meditationData?.visionResult?.objects || [],
          landmarks: meditationData?.visionResult?.landmarks || []
        });
      } catch (updateError) {
        console.error('Error updating image upload record with REST API:', updateError);
      }
    }

    return meditationId;
  } catch (error) {
    console.error('Error saving meditation with REST API:', error);
    throw error;
  }
};

// Track image upload using REST API
export const trackImageUploadRest = async (imageData) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : 'demo-user';
    console.log('Tracking image upload for user (REST API):', userId);

    // Generate a unique ID with timestamp
    const timestamp = Date.now();
    const uploadId = `upload-${timestamp}-${Math.floor(Math.random() * 1000)}`;

    // Prepare the upload data
    const uploadData = {
      userId,
      uploadTime: new Date().toISOString(),
      clientUploadTime: timestamp,
      imageSource: imageData.source || 'unknown',
      status: 'uploaded',
      metadata: {
        fileType: imageData.fileType || '',
        fileName: imageData.fileName || '',
        fileSize: imageData.fileSize || 0,
        dimensions: imageData.dimensions || { width: 0, height: 0 },
      }
    };

    // Convert to Firestore format
    const firestoreData = {
      fields: {}
    };

    for (const [key, value] of Object.entries(uploadData)) {
      firestoreData.fields[key] = jsonToFirestore(value);
    }

    console.log('Attempting to track image upload with REST API, ID:', uploadId);

    // Get the ID token for authentication
    const idToken = await getIdToken();

    // Prepare the URL and headers
    let url = `${FIRESTORE_BASE_URL}/imageUploads/${uploadId}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      url = `${url}?key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API call to:', url);

    // Make the REST API call
    const response = await fetch(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(firestoreData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firestore REST API error:', errorData);
      throw new Error(`Firestore REST API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Image upload tracked successfully with REST API:', responseData);

    return uploadId;
  } catch (error) {
    console.error('Error tracking image upload with REST API:', error);
    return null;
  }
};

// Update image analysis using REST API
export const updateImageAnalysisRest = async (uploadId, analysisData) => {
  try {
    if (!uploadId) {
      console.error('No upload ID provided for analysis update');
      return false;
    }

    console.log('Updating image analysis for upload ID (REST API):', uploadId);

    // Prepare the update data
    const timestamp = Date.now();
    const updateData = {
      status: 'analyzed',
      analysisTime: new Date().toISOString(),
      clientAnalysisTime: timestamp,
      analysisData: {
        emotions: analysisData.emotions || {},
        labels: analysisData.labels || [],
        dominantColors: analysisData.dominantColors || [],
        objects: analysisData.objects || [],
        landmarks: analysisData.landmarks || [],
      },
      meditationId: analysisData.meditationId || null
    };

    // Get the ID token for authentication
    const idToken = await getIdToken();

    // Prepare the URL and headers for GET request
    let getUrl = `${FIRESTORE_BASE_URL}/imageUploads/${uploadId}`;
    const getHeaders = {};

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      getHeaders['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      getUrl = `${getUrl}?key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API GET call to:', getUrl);

    // Get the current document
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: getHeaders
    });

    if (!getResponse.ok) {
      const errorData = await getResponse.json();
      console.error('Firestore REST API error (GET):', errorData);
      throw new Error(`Firestore REST API error: ${getResponse.status} ${getResponse.statusText}`);
    }

    const currentDoc = await getResponse.json();

    // Merge the current document with the update data
    const mergedData = {
      fields: { ...currentDoc.fields }
    };

    // Add the update fields
    for (const [key, value] of Object.entries(updateData)) {
      mergedData.fields[key] = jsonToFirestore(value);
    }

    // Prepare the URL and headers for PATCH request
    let updateUrl = `${FIRESTORE_BASE_URL}/imageUploads/${uploadId}?updateMask.fieldPaths=status&updateMask.fieldPaths=analysisTime&updateMask.fieldPaths=clientAnalysisTime&updateMask.fieldPaths=analysisData&updateMask.fieldPaths=meditationId`;
    const updateHeaders = {
      'Content-Type': 'application/json'
    };

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      updateHeaders['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      updateUrl = `${updateUrl}&key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API PATCH call to:', updateUrl);

    // Make the REST API call to update
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: updateHeaders,
      body: JSON.stringify(mergedData)
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Firestore REST API error (UPDATE):', errorData);
      throw new Error(`Firestore REST API error: ${updateResponse.status} ${updateResponse.statusText}`);
    }

    const responseData = await updateResponse.json();
    console.log('Image analysis updated successfully with REST API:', responseData);

    return true;
  } catch (error) {
    console.error('Error updating image analysis with REST API:', error);
    return false;
  }
};

// Get meditations for a user using REST API
export const getMeditationsForUserRest = async (userId) => {
  try {
    const actualUserId = userId || auth.currentUser?.uid || 'demo-user';
    console.log('Fetching meditations for user (REST API):', actualUserId);

    // Get the ID token for authentication
    const idToken = await getIdToken();

    // Prepare the URL and headers
    let url = `${FIRESTORE_BASE_URL}:runQuery`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      url = `${url}?key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API runQuery call to:', url);

    // Make the REST API call
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'meditations' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'userId' },
              op: 'EQUAL',
              value: { stringValue: actualUserId }
            }
          },
          orderBy: [{ field: { fieldPath: 'clientTimestamp' }, direction: 'DESCENDING' }]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firestore REST API error:', errorData);
      throw new Error(`Firestore REST API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Meditations fetched successfully with REST API:', responseData);

    // Process the response
    const meditations = responseData
      .filter(item => item.document) // Filter out empty results
      .map(item => {
        const docPath = item.document.name;
        const docId = docPath.split('/').pop();
        const docData = firestoreToJson(item.document);

        return {
          id: docId,
          ...docData
        };
      });

    console.log(`Found ${meditations.length} meditations with REST API`);
    return meditations;
  } catch (error) {
    console.error('Error fetching meditations with REST API:', error);
    return [];
  }
};

// Get recent uploads for a user using REST API
export const getRecentUploadsRest = async (userId, maxLimit = 10) => {
  try {
    const actualUserId = userId || auth.currentUser?.uid || 'demo-user';
    console.log(`Fetching recent uploads for user (REST API): ${actualUserId}, limit: ${maxLimit}`);

    // Get the ID token for authentication
    const idToken = await getIdToken();

    // Prepare the URL and headers
    let url = `${FIRESTORE_BASE_URL}:runQuery`;
    const headers = {
      'Content-Type': 'application/json'
    };

    // If we have a token, use it for authentication
    // Otherwise, append the API key to the URL
    if (idToken && idToken !== FIREBASE_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${idToken}`;
    } else {
      // Use API key in the URL for public access
      url = `${url}?key=${FIREBASE_CONFIG.apiKey}`;
    }

    console.log('Making REST API runQuery call to:', url);

    // Make the REST API call
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'imageUploads' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'userId' },
              op: 'EQUAL',
              value: { stringValue: actualUserId }
            }
          },
          orderBy: [{ field: { fieldPath: 'clientUploadTime' }, direction: 'DESCENDING' }],
          limit: maxLimit
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firestore REST API error:', errorData);
      throw new Error(`Firestore REST API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();

    // Process the response
    const uploads = responseData
      .filter(item => item.document) // Filter out empty results
      .map(item => {
        const docPath = item.document.name;
        const docId = docPath.split('/').pop();
        const docData = firestoreToJson(item.document);

        return {
          id: docId,
          ...docData
        };
      });

    console.log(`Found ${uploads.length} recent uploads with REST API`);
    return uploads;
  } catch (error) {
    console.error('Error fetching recent uploads with REST API:', error);
    return [];
  }
};

export default {
  saveMeditationRest,
  trackImageUploadRest,
  updateImageAnalysisRest,
  getMeditationsForUserRest,
  getRecentUploadsRest
};

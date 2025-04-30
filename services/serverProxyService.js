// serverProxyService.js - Uses the backend server as a proxy for Firestore operations

import axios from 'axios';

// Base URL for the backend server
const API_BASE_URL = 'http://localhost:8080/api/firestore';

// Save a meditation using the server proxy
export const saveMeditationProxy = async (meditationData) => {
  try {
    console.log('Saving meditation using server proxy');
    
    const response = await axios.post(`${API_BASE_URL}/meditations`, meditationData);
    
    if (response.status === 200) {
      console.log('Meditation saved successfully with server proxy, ID:', response.data.id);
      return response.data.id;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving meditation with server proxy:', error);
    throw error;
  }
};

// Track image upload using the server proxy
export const trackImageUploadProxy = async (imageData) => {
  try {
    console.log('Tracking image upload using server proxy');
    
    const response = await axios.post(`${API_BASE_URL}/imageUploads`, imageData);
    
    if (response.status === 200) {
      console.log('Image upload tracked successfully with server proxy, ID:', response.data.id);
      return response.data.id;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error tracking image upload with server proxy:', error);
    return null;
  }
};

// Update image analysis using the server proxy
export const updateImageAnalysisProxy = async (uploadId, analysisData) => {
  try {
    if (!uploadId) {
      console.error('No upload ID provided for analysis update');
      return false;
    }
    
    console.log('Updating image analysis using server proxy for upload ID:', uploadId);
    
    const response = await axios.patch(`${API_BASE_URL}/imageUploads/${uploadId}`, analysisData);
    
    if (response.status === 200) {
      console.log('Image analysis updated successfully with server proxy');
      return true;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating image analysis with server proxy:', error);
    return false;
  }
};

// Get meditations for a user using the server proxy
export const getMeditationsForUserProxy = async (userId) => {
  try {
    console.log('Fetching meditations using server proxy for user:', userId);
    
    const response = await axios.get(`${API_BASE_URL}/meditations/${userId}`);
    
    if (response.status === 200) {
      console.log(`Found ${response.data.length} meditations with server proxy`);
      return response.data;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching meditations with server proxy:', error);
    return [];
  }
};

// Get recent uploads for a user using the server proxy
export const getRecentUploadsProxy = async (userId, maxLimit = 10) => {
  try {
    console.log(`Fetching recent uploads using server proxy for user: ${userId}, limit: ${maxLimit}`);
    
    const response = await axios.get(`${API_BASE_URL}/imageUploads/${userId}?limit=${maxLimit}`);
    
    if (response.status === 200) {
      console.log(`Found ${response.data.length} recent uploads with server proxy`);
      return response.data;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching recent uploads with server proxy:', error);
    return [];
  }
};

export default {
  saveMeditationProxy,
  trackImageUploadProxy,
  updateImageAnalysisProxy,
  getMeditationsForUserProxy,
  getRecentUploadsProxy
};

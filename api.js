import axios from "axios";

// Set your backend URL here
const API_BASE = "http://localhost:8080";

// Helper function to check if a URL is from Google Photos
export const isGooglePhotosUrl = (url) => {
  return url && url.includes('googleusercontent.com');
};

// Helper function to ensure Google Photos URL has the right format
export const formatGooglePhotosUrl = (url) => {
  if (!url) return url;

  // Make sure Google Photos URLs have the =d parameter for full resolution
  if (isGooglePhotosUrl(url) && !url.includes('=d')) {
    return url + '=d';
  }

  return url;
};

// Function to proxy Google Photos URLs through our backend
export const proxyGooglePhotosUrl = async (url) => {
  if (!isGooglePhotosUrl(url)) {
    return url; // Not a Google Photos URL, return as is
  }

  try {
    console.log("Proxying Google Photos URL through backend...");
    const response = await axios.post(`${API_BASE}/api/proxy/google-photos`, { photoUrl: url });

    if (response.data && response.data.dataUrl) {
      console.log("Successfully proxied Google Photos URL to data URL");
      return response.data.dataUrl;
    } else {
      console.warn("Proxy response did not contain a data URL, using original URL");
      return url;
    }
  } catch (error) {
    console.error("Error proxying Google Photos URL:", error);
    return url; // Fall back to the original URL
  }
};

export const uploadPhoto = async (data) => {
  // Process the URL if it's from Google Photos
  const processedData = { ...data };

  if (data.photoUrl) {
    // If it's a Google Photos URL and not already a data URL, try to proxy it
    if (isGooglePhotosUrl(data.photoUrl) && !data.photoUrl.startsWith('data:')) {
      try {
        console.log("Detected Google Photos URL, attempting to proxy...");
        processedData.photoUrl = await proxyGooglePhotosUrl(data.photoUrl);
      } catch (error) {
        console.error("Failed to proxy Google Photos URL:", error);
        // Fall back to the original URL with formatting
        processedData.photoUrl = formatGooglePhotosUrl(data.photoUrl);
      }
    } else {
      // For non-Google Photos URLs or already data URLs, just format if needed
      processedData.photoUrl = formatGooglePhotosUrl(data.photoUrl);
    }

    console.log("Uploading with processed URL:",
      processedData.photoUrl.startsWith('data:')
        ? "data:URL (truncated)"
        : processedData.photoUrl.substring(0, 100) + "...");
  }

  return axios.post(`${API_BASE}/api/photos`, processedData);
};

export const getMeditations = (userId) =>
  axios.get(`${API_BASE}/api/meditations/${userId}`);

export const getMeditation = (id) =>
  axios.get(`${API_BASE}/api/meditation/${id}`);

// Direct image analysis API - more reliable than URL-based approach
export const analyzeImage = (data) => {
  return axios.post(`${API_BASE}/api/analyze-image`, data);
};
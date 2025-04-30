/**
 * Utility functions for handling images
 */

/**
 * Check if a URL is from Google Photos
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL is from Google Photos
 */
export const isGooglePhotosUrl = (url) => {
  return url && url.includes('googleusercontent.com');
};

/**
 * Format a Google Photos URL for full resolution
 * @param {string} url - The Google Photos URL
 * @returns {string} - The formatted URL
 */
export const formatGooglePhotosUrl = (url) => {
  if (!url) return url;

  // Make sure Google Photos URLs have the =d parameter for full resolution
  if (isGooglePhotosUrl(url)) {
    // Remove any existing parameters
    const baseUrl = url.split('=')[0];

    // Add full resolution parameter
    // Use =d parameter for direct download (original size)
    // This works better with the Vision API and Google Photos authentication
    return baseUrl + '=d';
  }

  return url;
};

/**
 * Get a direct download URL for a Google Photos image
 * This is a more reliable way to get the image for processing
 * @param {string} url - The Google Photos URL
 * @returns {string} - The direct download URL
 */
export const getGooglePhotosDirectUrl = (url) => {
  if (!isGooglePhotosUrl(url)) return url;

  // Remove any existing parameters
  const baseUrl = url.split('=')[0];

  // Add download parameter
  return baseUrl + '=d';
};

/**
 * Convert a data URL to base64
 * @param {string} dataUrl - The data URL
 * @returns {string} - The base64 data
 */
export const dataUrlToBase64 = (dataUrl) => {
  if (!dataUrl) return null;

  // Extract base64 data from data URL
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }

  return dataUrl;
};

/**
 * Get a thumbnail version of a Google Photos URL
 * @param {string} url - The Google Photos URL
 * @returns {string} - The thumbnail URL
 */
export const getGooglePhotosThumbnail = (url) => {
  if (!isGooglePhotosUrl(url)) return url;

  // Remove any existing parameters
  const baseUrl = url.split('=')[0];

  // Add thumbnail parameter (w100-h100)
  return baseUrl + '=w100-h100';
};

/**
 * Get a medium-sized version of a Google Photos URL
 * @param {string} url - The Google Photos URL
 * @returns {string} - The medium-sized URL
 */
export const getGooglePhotosMedium = (url) => {
  if (!isGooglePhotosUrl(url)) return url;

  // Remove any existing parameters
  const baseUrl = url.split('=')[0];

  // Add medium size parameter (w500-h500)
  return baseUrl + '=w500-h500';
};

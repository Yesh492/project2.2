import * as React from "react";
const { useState, useEffect } = React;
import axios from "axios";
import { formatGooglePhotosUrl } from "../utils/imageUtils";
import { auth } from "../firebase";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";

// Google Photos API endpoints
const PHOTOS_API_BASE = "https://photoslibrary.googleapis.com/v1";

/**
 * GooglePhotosPicker Component
 * Uses the access token from Firebase authentication to access Google Photos
 */
export default function GooglePhotosPicker({ onPhotoSelected }) {
  // State for photos, loading, and authentication
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  // Check for existing access token on component mount
  useEffect(() => {
    console.log("GooglePhotosPicker mounted");

    // Check if user is signed in with Google
    const checkGoogleAuth = async () => {
      setLoading(true);

      try {
        // Check if we have a stored access token
        const accessToken = localStorage.getItem('googleAccessToken');

        if (accessToken) {
          console.log("Found Google access token, fetching photos...");
          await fetchPhotos(accessToken);
          setAuthenticated(true);
        } else if (auth.currentUser && !auth.currentUser.isAnonymous) {
          console.log("User is signed in but no access token found");
          // We have a signed-in user but no access token
          // This might happen if the user signed in with Google but we couldn't get the token
          setError("Please sign out and sign in again with Google to access your photos");
        } else {
          console.log("No Google authentication found");
          setError("Please sign in with Google to access your photos");
        }
      } catch (err) {
        console.error("Error checking Google authentication:", err);
        setError("Failed to authenticate with Google Photos: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    checkGoogleAuth();

    return () => {
      // Clean up if needed
    };
  }, []);

  // Fetch photos from Google Photos API
  const fetchPhotos = async (accessToken) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching photos from Google Photos API...");

      if (!accessToken) {
        throw new Error("No access token available. Please sign in again.");
      }

      console.log("Using access token:", accessToken.substring(0, 10) + "...");

      // Make request to Google Photos API
      const response = await axios.get(`${PHOTOS_API_BASE}/mediaItems`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          pageSize: 50  // Fetch up to 50 photos
        }
      });

      console.log("Google Photos API response status:", response.status);

      if (response.data && response.data.mediaItems) {
        // Filter for only images (not videos)
        const imageItems = response.data.mediaItems.filter(
          item => item.mimeType && item.mimeType.startsWith('image/')
        );

        setPhotos(imageItems);

        // Save next page token if available
        if (response.data.nextPageToken) {
          setNextPageToken(response.data.nextPageToken);
        }

        console.log(`Fetched ${imageItems.length} photos`);
      } else {
        console.log("No photos found or invalid response format");
        setPhotos([]);
      }
    } catch (error) {
      console.error("Error fetching Google Photos:", error);

      // Handle different error scenarios
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);

        if (error.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('googleAccessToken');
          setAuthenticated(false);
          setError("Your Google Photos access has expired. Please sign in again.");
        } else if (error.response.status === 403) {
          // Permission denied - likely scope issue
          localStorage.removeItem('googleAccessToken');
          setAuthenticated(false);
          setError("Permission denied. Please sign in again and grant access to your Google Photos.");
        } else {
          setError(`Failed to fetch photos: Server returned ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        setError("Failed to fetch photos: No response from Google Photos API. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        setError(`Failed to fetch photos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    console.log("Refreshing photos...");

    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) {
      setError("No access token available. Please sign in again.");
      setAuthenticated(false);
      return;
    }

    // Fetch photos with the current token
    await fetchPhotos(accessToken);
  };

  // Load more photos (for pagination)
  const loadMorePhotos = async () => {
    if (!nextPageToken) return;

    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('googleAccessToken');
      if (!accessToken) {
        throw new Error("No access token available. Please sign in again.");
      }

      console.log("Loading more photos with token:", nextPageToken.substring(0, 10) + "...");

      // Make request to Google Photos API with page token
      const response = await axios.get(`${PHOTOS_API_BASE}/mediaItems`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          pageSize: 50,
          pageToken: nextPageToken
        }
      });

      console.log("Load more response status:", response.status);

      if (response.data && response.data.mediaItems) {
        // Filter for only images (not videos)
        const imageItems = response.data.mediaItems.filter(
          item => item.mimeType && item.mimeType.startsWith('image/')
        );

        console.log(`Loaded ${imageItems.length} more photos`);

        // Append new photos to existing photos
        setPhotos(prevPhotos => [...prevPhotos, ...imageItems]);

        // Update next page token
        if (response.data.nextPageToken) {
          setNextPageToken(response.data.nextPageToken);
        } else {
          setNextPageToken(null); // No more pages
        }
      } else {
        console.log("No more photos found");
        setNextPageToken(null);
      }
    } catch (error) {
      console.error("Error loading more photos:", error);

      // Handle different error scenarios
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);

        if (error.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('googleAccessToken');
          setAuthenticated(false);
          setError("Your Google Photos access has expired. Please sign in again.");
        } else if (error.response.status === 403) {
          // Permission denied - likely scope issue
          localStorage.removeItem('googleAccessToken');
          setAuthenticated(false);
          setError("Permission denied. Please sign in again and grant access to your Google Photos.");
        } else {
          setError(`Failed to load more photos: Server returned ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        setError("Failed to load more photos: No response from Google Photos API. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        setError(`Failed to load more photos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In button click
  const handleSignIn = () => {
    // Redirect to sign-in page
    window.location.href = '/signin';
  };

  // Handle photo selection
  const handlePhotoSelection = (photo) => {
    // Format the URL for full resolution
    const photoUrl = formatGooglePhotosUrl(photo.baseUrl);
    console.log("Selected photo URL:", photoUrl);

    // Show processing indicator
    setProcessingPhoto(true);

    // Pass the URL to the parent component
    onPhotoSelected(photoUrl);

    // Hide processing indicator after a short delay
    setTimeout(() => {
      setProcessingPhoto(false);
    }, 500);
  };

  // Render the component
  return (
    <div className="google-photos-container">
      {!authenticated ? (
        <div className="google-photos-signin">
          {error && (
            <div className="google-photos-error">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}
          <button
            className="google-photos-login-btn"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? "Checking authentication..." : "Sign in with Google to access your photos"}
          </button>
        </div>
      ) : (
        <div className="google-photos-authenticated">
          <div className="google-photos-header">
            <h3>Your Google Photos</h3>
            {loading && <span className="loading-indicator">Loading...</span>}
            {processingPhoto && <span className="processing-indicator">Processing photo...</span>}
            {error && (
              <div className="google-photos-error">
                <FiAlertCircle />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="google-photos-grid">
            {photos.length > 0 ? (
              <>
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`photo-item ${processingPhoto ? 'disabled' : ''}`}
                    onClick={() => !processingPhoto && handlePhotoSelection(photo)}
                    title={photo.filename || "Select this photo"}
                  >
                    <img
                      src={`${photo.baseUrl}=w160-h160-c`}
                      alt={photo.filename || "Google Photo"}
                      loading="lazy"
                    />
                  </div>
                ))}

                {nextPageToken && (
                  <div className="load-more-container">
                    <button
                      className="load-more-btn"
                      onClick={loadMorePhotos}
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Load More Photos"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-photos-message">
                {loading ? "Loading your photos..." : "No photos found in your Google Photos account"}
              </div>
            )}
          </div>

          <div className="google-photos-footer">
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              <FiRefreshCw /> Refresh Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
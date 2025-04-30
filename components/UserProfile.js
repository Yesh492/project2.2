import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiUser, FiMail, FiClock, FiInfo } from 'react-icons/fi';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        
        if (!user) {
          setError('No user is signed in');
          setLoading(false);
          return;
        }

        // Get user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setError('User data not found in Firestore');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch user data when component mounts
    fetchUserData();

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      } else {
        setUserData(null);
        setError('No user is signed in');
        setLoading(false);
      }
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Convert Firestore timestamp to JavaScript Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  // Get provider name
  const getProviderName = (providerId) => {
    switch (providerId) {
      case 'google.com':
        return 'Google';
      case 'password':
        return 'Email/Password';
      case 'anonymous':
        return 'Anonymous';
      default:
        return providerId || 'Unknown';
    }
  };

  if (loading) {
    return <div className="user-profile-loading">Loading user data...</div>;
  }

  if (error) {
    return <div className="user-profile-error">{error}</div>;
  }

  if (!userData) {
    return <div className="user-profile-error">No user data available</div>;
  }

  return (
    <div className="user-profile-container">
      <h2 className="user-profile-title">User Profile</h2>
      
      <div className="user-profile-avatar">
        {userData.photoURL ? (
          <img src={userData.photoURL} alt="User avatar" />
        ) : (
          <div className="user-profile-avatar-placeholder">
            <FiUser size={40} />
          </div>
        )}
      </div>
      
      <div className="user-profile-info">
        <div className="user-profile-item">
          <FiUser className="user-profile-icon" />
          <div>
            <span className="user-profile-label">Name</span>
            <span className="user-profile-value">{userData.displayName || 'Anonymous User'}</span>
          </div>
        </div>
        
        <div className="user-profile-item">
          <FiMail className="user-profile-icon" />
          <div>
            <span className="user-profile-label">Email</span>
            <span className="user-profile-value">{userData.email || 'Not provided'}</span>
          </div>
        </div>
        
        <div className="user-profile-item">
          <FiInfo className="user-profile-icon" />
          <div>
            <span className="user-profile-label">Sign-in Provider</span>
            <span className="user-profile-value">{getProviderName(userData.provider)}</span>
          </div>
        </div>
        
        <div className="user-profile-item">
          <FiClock className="user-profile-icon" />
          <div>
            <span className="user-profile-label">Last Login</span>
            <span className="user-profile-value">{formatDate(userData.lastLogin)}</span>
          </div>
        </div>
        
        <div className="user-profile-item">
          <FiClock className="user-profile-icon" />
          <div>
            <span className="user-profile-label">Account Created</span>
            <span className="user-profile-value">{formatDate(userData.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div className="user-profile-footer">
        <span className="user-profile-uid">User ID: {userData.uid}</span>
      </div>
    </div>
  );
};

export default UserProfile;

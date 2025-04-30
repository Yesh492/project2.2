import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertCircle } from 'react-icons/fi';
import { auth, signInWithGoogle, saveUserToFirestore, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SignIn = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to sign in with Google...');

      // Use Firebase for Google sign-in
      const user = await signInWithGoogle();
      console.log("Google sign-in successful:", user.uid);

      // Redirect to meditation page on success
      navigate('/meditate');
    } catch (error) {
      console.error("Google sign-in error:", error);

      // Provide a more user-friendly error message
      if (error.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This website is not authorized for sign-in. Please try using Guest sign-in instead.');
        console.error('The current domain is not authorized in Firebase console. Add it to the authorized domains list.');
      } else if (error.code === 'auth/missing-or-invalid-nonce') {
        setError('Authentication error. Please try again or use Guest sign-in.');
        console.error('Missing or invalid nonce in the request.');
      } else if (error.code === 'auth/internal-error') {
        setError('Authentication service is temporarily unavailable. Please try using Guest sign-in instead.');
        console.error('Internal authentication error:', error);
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        setError('Authentication permissions issue. Please try using Guest sign-in instead.');
      } else {
        setError(error.message || 'Failed to sign in with Google. Please try again or use Guest sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('Attempting anonymous sign-in...');
      console.log('Current domain:', window.location.hostname);

      // Sign in anonymously
      const result = await signInAnonymously(auth);
      console.log("Anonymous sign-in successful:", result.user.uid);

      // Wait briefly to ensure Firebase Auth is fully initialized
      console.log('Waiting briefly before saving anonymous user data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a unique guest username
      const timestamp = new Date().getTime().toString().slice(-6);
      const guestId = `Guest-${timestamp}`;

      // Create a custom user object with a display name
      const customUser = {
        ...result.user,
        displayName: guestId,
        username: guestId
      };

      console.log('Created custom user object:', {
        uid: customUser.uid,
        displayName: customUser.displayName,
        username: customUser.username,
        isAnonymous: customUser.isAnonymous
      });

      // Explicitly save user data to Firestore with a custom username
      try {
        const saved = await saveUserToFirestore(customUser);

        if (saved) {
          console.log("Anonymous user data saved to Firestore");
        } else {
          console.warn('Failed to save anonymous user data to Firestore, but continuing with authentication');

          // Try saving to public collection instead
          try {
            const publicUserRef = doc(db, 'public', result.user.uid);
            await setDoc(publicUserRef, {
              uid: result.user.uid,
              displayName: customUser.displayName,
              username: customUser.username,
              isAnonymous: true,
              lastLogin: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            console.log('Anonymous user data saved to public collection successfully');
          } catch (publicSaveError) {
            console.error('Failed to save anonymous user data to public collection:', publicSaveError);
          }
        }
      } catch (firestoreError) {
        console.error('Error saving anonymous user to Firestore:', firestoreError);
        // Continue anyway - we'll just use the authenticated user without Firestore data
        console.log('Continuing with anonymous authentication despite Firestore error');
      }

      // Redirect to meditation page on success
      navigate('/meditate');
    } catch (error) {
      console.error("Anonymous sign-in error:", error);

      // Provide a more user-friendly error message for anonymous sign-in
      if (error.code === 'auth/operation-not-allowed') {
        setError('Anonymous sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/internal-error') {
        setError('Authentication service is temporarily unavailable. Please try again later.');
        console.error('Internal authentication error:', error);
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This website is not authorized for sign-in. Please try again later.');
        console.error('The current domain is not authorized in Firebase console.');
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        setError('Authentication permissions issue. Please try again later.');
      } else {
        setError(error.message || 'Failed to sign in as guest. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container-new">
        <motion.div
          className="signin-left"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="signin-title-new">Sign in</h1>

          <p className="signin-subtitle-new">
            Please sign in to continue.
          </p>

          {error && (
            <div className="error-message">
              <FiAlertCircle />
              <span>{error}</span>
              {error.includes('Missing or insufficient permissions') && (
                <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                  Try using the "Continue as Guest" option instead.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="google-signin-button-new"
            disabled={loading}
          >
            <div className="google-icon-wrapper">
              <img
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
                alt="Google"
                className="google-icon"
              />
            </div>
            <span className="google-signin-text">Sign in with Google</span>
          </button>

          <button
            onClick={handleAnonymousSignIn}
            className="anonymous-signin-button-new"
            disabled={loading}
          >
            Continue as Guest
          </button>
        </motion.div>

        <motion.div
          className="signin-right"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="signin-image-container-new">
            <img
              src="https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
              alt="Woman in yoga pose"
              className="signin-yoga-image"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;

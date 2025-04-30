import * as React from 'react';
const { useState, useEffect } = React;
import { getRecentUploads } from '../services/dataService';
import { motion } from 'framer-motion';
import { FiClock, FiImage, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { FEATURES } from '../config';

const UploadHistory = ({ userId, limit = 5 }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching uploads for user ${userId} with limit ${limit}`);

      // Fetch uploads using our unified data service
      const data = await getRecentUploads(userId, limit);

      if (FEATURES.ENABLE_DETAILED_LOGGING) {
        console.log(`Received ${data.length} uploads`);
      }

      setUploads(data);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      setError('Failed to load upload history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();

    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      if (expanded) {
        console.log('Auto-refreshing upload history');
        fetchUploads();
      }
    }, 30000); // Refresh every 30 seconds if expanded

    return () => clearInterval(refreshInterval);
  }, [userId, limit, expanded]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'analyzed':
        return <FiCheckCircle className="status-icon success" />;
      case 'uploaded':
        return <FiClock className="status-icon pending" />;
      default:
        return <FiAlertCircle className="status-icon error" />;
    }
  };

  if (loading) {
    return (
      <div className="upload-history-container">
        <div className="upload-history-header">
          <h3>Recent Uploads</h3>
          <button className="refresh-button" onClick={fetchUploads} disabled>
            <FiRefreshCw className="spinning" />
          </button>
        </div>
        <div className="loading-indicator">Loading upload history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="upload-history-container">
        <div className="upload-history-header">
          <h3>Recent Uploads</h3>
          <button className="refresh-button" onClick={fetchUploads}>
            <FiRefreshCw />
          </button>
        </div>
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={fetchUploads}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="upload-history-container">
        <div className="upload-history-header">
          <h3>Recent Uploads</h3>
          <button className="refresh-button" onClick={fetchUploads}>
            <FiRefreshCw />
          </button>
        </div>
        <div className="empty-history">No recent uploads found</div>
      </div>
    );
  }

  return (
    <motion.div
      className="upload-history-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="upload-history-header">
        <div className="header-title" onClick={() => setExpanded(!expanded)}>
          <h3>Recent Uploads {uploads.length > 0 && `(${uploads.length})`}</h3>
          <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
        </div>
        <button className="refresh-button" onClick={fetchUploads} title="Refresh uploads">
          <FiRefreshCw />
        </button>
      </div>

      {expanded && (
        <div className="upload-history-list">
          {uploads.map((upload) => (
            <div key={upload.id} className="upload-history-item">
              <div className="upload-icon">
                <FiImage />
              </div>
              <div className="upload-details">
                <div className="upload-filename">
                  {upload.metadata?.fileName || 'Unnamed file'}
                </div>
                <div className="upload-info">
                  {upload.metadata?.fileType || 'Unknown type'} •
                  {upload.metadata?.fileSize ? ` ${Math.round(upload.metadata.fileSize / 1024)} KB` : ' Unknown size'}
                </div>
                <div className="upload-time">
                  Uploaded: {formatDate(upload.uploadTime)}
                </div>
                {upload.analysisTime && (
                  <div className="analysis-time">
                    Analyzed: {formatDate(upload.analysisTime)}
                  </div>
                )}
              </div>
              <div className="upload-status">
                {getStatusIcon(upload.status)}
                <span className="status-text">{upload.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UploadHistory;

import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';

const router = express.Router();



// Initialize Firestore with explicit credentials
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './gcloud-key.json';
console.log(`Reading service account key from: ${serviceAccountPath}`);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account key file not found at ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));
console.log('Service account project ID:', serviceAccount.project_id);

// Initialize Firestore with explicit credentials
const db = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: serviceAccount
});

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

// Save a meditation
router.post('/meditations', async (req, res) => {
  try {
    const meditationData = req.body;

    if (!meditationData) {
      return res.status(400).json({ error: 'No meditation data provided' });
    }

    // Generate a unique ID with timestamp to avoid collisions
    const timestamp = Date.now();
    const meditationId = `meditation-${timestamp}-${Math.floor(Math.random() * 1000)}`;

    // Convert to Firestore format
    const firestoreData = {};

    for (const [key, value] of Object.entries(meditationData)) {
      firestoreData[key] = value;
    }

    // Add server timestamp
    firestoreData.createdAt = new Date().toISOString();
    firestoreData.clientTimestamp = timestamp;

    // Save to Firestore using the admin SDK
    await db.collection('meditations').doc(meditationId).set(firestoreData);

    console.log('Meditation saved successfully with ID:', meditationId);

    // Return the meditation ID
    res.status(200).json({ id: meditationId });
  } catch (error) {
    console.error('Error saving meditation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track image upload
router.post('/imageUploads', async (req, res) => {
  try {
    const uploadData = req.body;

    if (!uploadData) {
      return res.status(400).json({ error: 'No upload data provided' });
    }

    // Generate a unique ID with timestamp
    const timestamp = Date.now();
    const uploadId = `upload-${timestamp}-${Math.floor(Math.random() * 1000)}`;

    // Add server timestamp
    uploadData.uploadTime = new Date().toISOString();
    uploadData.clientUploadTime = timestamp;

    // Save to Firestore using the admin SDK
    await db.collection('imageUploads').doc(uploadId).set(uploadData);

    console.log('Image upload tracked successfully with ID:', uploadId);

    // Return the upload ID
    res.status(200).json({ id: uploadId });
  } catch (error) {
    console.error('Error tracking image upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update image analysis
router.patch('/imageUploads/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const analysisData = req.body;

    if (!uploadId) {
      return res.status(400).json({ error: 'No upload ID provided' });
    }

    if (!analysisData) {
      return res.status(400).json({ error: 'No analysis data provided' });
    }

    // Add server timestamp
    analysisData.analysisTime = new Date().toISOString();
    analysisData.clientAnalysisTime = Date.now();

    // Update the document
    await db.collection('imageUploads').doc(uploadId).update(analysisData);

    console.log('Image analysis updated successfully for upload ID:', uploadId);

    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating image analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get meditations for a user
router.get('/meditations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'No user ID provided' });
    }

    // Query Firestore
    const snapshot = await db.collection('meditations')
      .where('userId', '==', userId)
      .orderBy('clientTimestamp', 'desc')
      .get();

    // Convert to array of documents
    const meditations = [];

    snapshot.forEach(doc => {
      meditations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Found ${meditations.length} meditations for user ${userId}`);

    // Return the meditations
    res.status(200).json(meditations);
  } catch (error) {
    console.error('Error getting meditations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent uploads for a user
router.get('/imageUploads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'No user ID provided' });
    }

    // Query Firestore
    let query = db.collection('imageUploads')
      .where('userId', '==', userId)
      .orderBy('clientUploadTime', 'desc');

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const snapshot = await query.get();

    // Convert to array of documents
    const uploads = [];

    snapshot.forEach(doc => {
      uploads.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`Found ${uploads.length} uploads for user ${userId}`);

    // Return the uploads
    res.status(200).json(uploads);
  } catch (error) {
    console.error('Error getting uploads:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

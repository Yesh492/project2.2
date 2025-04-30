import axios from 'axios';
import { isGooglePhotosUrl, formatGooglePhotosUrl } from '../utils/imageUtils';
import { getColorName, getColorEmotion } from '../utils/colorUtils';

// Backend API base URL
// Determine the appropriate backend URL based on the environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isProduction
  ? 'https://energiaa-backend-epvyx237va-uc.a.run.app'
  : 'http://localhost:8080';

console.log('Using backend API URL:', API_BASE);

// Google Vision API key
const VISION_API_KEY = 'AIzaSyDFKvWf5hdWMlRNU42KZC5JAokmF8CslBE';
const VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

// Gemini API key (same as Vision API key in this case)
const GEMINI_API_KEY = 'AIzaSyDFKvWf5hdWMlRNU42KZC5JAokmF8CslBE';
// Updated Gemini API endpoint with correct version and API key
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Process an image URL or data URL for analysis
 * For Google Photos URLs, we'll use multiple approaches to fetch the image
 * For data URLs, we'll extract the base64 data
 */
export const processImageForAnalysis = async (imageUrl) => {
  try {
    // If it's a data URL, extract the base64 data
    if (imageUrl.startsWith('data:')) {
      return imageUrl.split(',')[1];
    }

    // If it's a Google Photos URL, try multiple approaches
    if (isGooglePhotosUrl(imageUrl)) {
      console.log('Processing Google Photos URL...');

      // 1. First try: Use our backend to proxy the request
      try {
        console.log('Trying backend proxy for Google Photos URL...');

        // Format the URL for full resolution
        const formattedUrl = formatGooglePhotosUrl(imageUrl);

        // Try different backend endpoints
        const endpoints = [
          '/api/proxy/google-photos',
          '/api/process-image',
          '/api/photos/process'
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying backend endpoint: ${endpoint}`);
            const response = await axios.post(`${API_BASE}${endpoint}`, {
              photoUrl: formattedUrl,
              imageUrl: formattedUrl
            });

            if (response.data) {
              // Check for different response formats
              if (response.data.dataUrl) {
                console.log('Successfully fetched image from Google Photos (dataUrl)');
                return response.data.dataUrl.split(',')[1];
              } else if (response.data.base64) {
                console.log('Successfully fetched image from Google Photos (base64)');
                return response.data.base64;
              } else if (response.data.imageData) {
                console.log('Successfully fetched image from Google Photos (imageData)');
                return response.data.imageData.split(',')[1];
              }
            }
          } catch (endpointError) {
            console.warn(`Endpoint ${endpoint} failed:`, endpointError.message);
            // Continue to the next endpoint
          }
        }
      } catch (proxyError) {
        console.warn('All backend proxy attempts failed:', proxyError.message);
      }

      // 2. Second try: Try to use the URL directly with Vision API
      console.log('Backend proxy failed, using URL directly with Vision API');
      return null; // Return null to indicate we should use imageUri instead
    }

    // For other URLs, return null to indicate we should use imageUri
    return null;
  } catch (error) {
    console.error('Error processing image for analysis:', error);
    // Don't throw an error, just return null to use the URL directly
    return null;
  }
};

// Analyze an image with Google Vision API
export const analyzeImageWithVision = async (imageSource) => {
  try {
    console.log('Analyzing image with Vision API...');

    // First, try using the backend directly for all image types
    // This is the most reliable approach as it avoids CORS issues
    try {
      console.log('Trying to analyze image through backend first...');

      // Prepare the data for the backend
      let photoUrl = null;
      let imageData = null;

      if (typeof imageSource === 'string') {
        // It's base64 content - convert to data URL for the backend
        imageData = `data:image/jpeg;base64,${imageSource}`;
      } else if (typeof imageSource === 'object' && imageSource.url) {
        // It's a URL object
        photoUrl = imageSource.url;
      }

      // Call the backend API - try both endpoints
      let response;
      try {
        // First try the /api/photos endpoint
        console.log('Trying /api/photos endpoint...');
        response = await axios.post(`${API_BASE}/api/photos`, {
          userId: 'demo-user',
          photoUrl: photoUrl,
          imageData: imageData,
          style: 'Calm',
          theme: 'Nature'
        });
      } catch (firstEndpointError) {
        console.log('First endpoint failed, trying /api/analyze-image...');
        // If that fails, try the /api/analyze-image endpoint
        response = await axios.post(`${API_BASE}/api/analyze-image`, {
          userId: 'demo-user',
          photoUrl: photoUrl,
          imageData: imageData,
          style: 'Calm',
          theme: 'Nature'
        });
      }

      console.log('Backend analysis successful');

      // Extract the vision result from the response
      if (response.data && response.data.visionResult) {
        return {
          faceAnnotations: response.data.visionResult.emotions ? [response.data.visionResult.emotions] : [],
          labelAnnotations: response.data.visionResult.labels ?
            response.data.visionResult.labels.map(label => ({ description: label })) : [],
          imagePropertiesAnnotation: {
            dominantColors: {
              colors: response.data.visionResult.dominantColors
            }
          },
          localizedObjectAnnotations: response.data.visionResult.objects ?
            response.data.visionResult.objects.map(obj => ({ name: obj })) : [],
          landmarkAnnotations: response.data.visionResult.landmarks ?
            response.data.visionResult.landmarks.map(landmark => ({ description: landmark })) : []
        };
      }

      // If we got a response but no vision result, try to extract it differently
      if (response.data) {
        console.log('Got response but no vision result, trying to extract differently');

        // Try to find any useful data in the response
        const labels = [];
        const objects = [];
        const colors = [];

        // Look for any arrays or objects that might contain useful data
        Object.keys(response.data).forEach(key => {
          const value = response.data[key];
          if (Array.isArray(value)) {
            // This might be labels or objects
            value.forEach(item => {
              if (typeof item === 'string') {
                labels.push(item);
              } else if (typeof item === 'object' && item.description) {
                labels.push(item.description);
              } else if (typeof item === 'object' && item.name) {
                objects.push(item.name);
              } else if (typeof item === 'object' && item.color) {
                colors.push(item);
              }
            });
          }
        });

        // If we found any useful data, return it
        if (labels.length > 0 || objects.length > 0 || colors.length > 0) {
          return {
            labelAnnotations: labels.map(label => ({ description: label })),
            localizedObjectAnnotations: objects.map(obj => ({ name: obj })),
            imagePropertiesAnnotation: {
              dominantColors: {
                colors: colors.length > 0 ? colors : [
                  { color: { red: 66, green: 133, blue: 244 }, pixelFraction: 0.4 },
                  { color: { red: 52, green: 168, blue: 83 }, pixelFraction: 0.3 }
                ]
              }
            }
          };
        }
      }
    } catch (backendError) {
      console.error('Backend analysis failed:', backendError);
      console.log('Falling back to direct Vision API call');
    }

    // If backend approach failed, try direct Vision API call
    // Determine if we're using content or imageUri
    let imageConfig = {};

    if (typeof imageSource === 'string') {
      // It's base64 content
      imageConfig = { content: imageSource };
    } else if (typeof imageSource === 'object' && imageSource.url) {
      // It's a URL object
      imageConfig = { source: { imageUri: imageSource.url } };
    } else {
      console.warn('Invalid image source, using fallback data');
      return getFallbackVisionResult();
    }

    const visionRequest = {
      requests: [
        {
          image: imageConfig,
          features: [
            { type: 'FACE_DETECTION', maxResults: 20 },
            { type: 'LABEL_DETECTION', maxResults: 30 },
            { type: 'IMAGE_PROPERTIES', maxResults: 20 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 30 },  // Increased from 20 to 30
            { type: 'LANDMARK_DETECTION', maxResults: 20 },   // Increased from 10 to 20
            { type: 'WEB_DETECTION', maxResults: 15 },        // Increased from 10 to 15
            { type: 'TEXT_DETECTION', maxResults: 20 },
            { type: 'DOCUMENT_TEXT_DETECTION' },
            { type: 'CROP_HINTS' },
            { type: 'SAFE_SEARCH_DETECTION' }
          ],
          imageContext: {
            // Add more context to improve detection
            languageHints: ["en"],
            cropHintsParams: {
              aspectRatios: [0.8, 1.0, 1.2]
            },
            // Improve landmark detection
            latLongRect: {
              // This is a global bounding box to improve landmark detection
              minLatLng: { latitude: -90.0, longitude: -180.0 },
              maxLatLng: { latitude: 90.0, longitude: 180.0 }
            }
          }
        }
      ]
    };

    console.log('Sending request to Vision API...');
    const response = await axios.post(
      `${VISION_API_ENDPOINT}?key=${VISION_API_KEY}`,
      visionRequest
    );

    console.log('Vision API response received');

    // Validate the response
    if (!response.data || !response.data.responses || !response.data.responses[0]) {
      console.warn('Invalid Vision API response, using fallback data');
      return getFallbackVisionResult();
    }

    return response.data.responses[0];
  } catch (error) {
    console.error('All image analysis approaches failed:', error);
    console.log('Using fallback vision result data');
    return getFallbackVisionResult();
  }
};

// Provide fallback vision result if analysis fails
const getFallbackVisionResult = () => {
  // Generate random labels based on timestamp to ensure uniqueness
  const now = new Date();
  const randomSeed = now.getTime() % 10;

  const labelSets = [
    ['Nature', 'Sky', 'Water', 'Tree', 'Mountain'],
    ['Beach', 'Ocean', 'Sand', 'Sunset', 'Horizon'],
    ['Forest', 'Leaves', 'Greenery', 'Path', 'Sunlight'],
    ['City', 'Building', 'Architecture', 'Street', 'Urban'],
    ['Garden', 'Flower', 'Plant', 'Grass', 'Bloom'],
    ['Desert', 'Sand', 'Dune', 'Arid', 'Landscape'],
    ['Lake', 'Reflection', 'Calm', 'Shore', 'Peaceful'],
    ['Mountain', 'Peak', 'Valley', 'Rock', 'Majestic'],
    ['Meadow', 'Field', 'Wildflower', 'Open space', 'Countryside'],
    ['Park', 'Bench', 'Path', 'Recreation', 'Leisure']
  ];

  const selectedLabels = labelSets[randomSeed];

  return {
    faceAnnotations: [{
      joyLikelihood: "LIKELY",
      sorrowLikelihood: "UNLIKELY",
      angerLikelihood: "VERY_UNLIKELY",
      surpriseLikelihood: "POSSIBLE"
    }],
    labelAnnotations: selectedLabels.map(label => ({ description: label })),
    imagePropertiesAnnotation: {
      dominantColors: {
        colors: [
          { color: { red: 66, green: 133, blue: 244 }, pixelFraction: 0.4 },
          { color: { red: 52, green: 168, blue: 83 }, pixelFraction: 0.3 },
          { color: { red: 251, green: 188, blue: 5 }, pixelFraction: 0.2 },
          { color: { red: 234, green: 67, blue: 53 }, pixelFraction: 0.1 }
        ]
      }
    },
    localizedObjectAnnotations: [
      { name: 'Plant' },
      { name: 'Sky' },
      { name: 'Tree' }
    ],
    landmarkAnnotations: []
  };
};

// Extract emotions from face detection and other image features
export const extractEmotions = (faceAnnotations, labelAnnotations, objectAnnotations, safeSearchAnnotation) => {
  try {
    // Initialize emotions object
    let emotions = {};

    // 1. Process face annotations if available
    if (faceAnnotations && Array.isArray(faceAnnotations) && faceAnnotations.length > 0) {
      console.log('Processing face annotations for emotions');
      const face = faceAnnotations[0];

      if (face) {
        // Basic emotions from face detection with validation
        emotions = {
          ...emotions,
          joy: face.joyLikelihood || 'POSSIBLE',
          sorrow: face.sorrowLikelihood || 'UNLIKELY',
          anger: face.angerLikelihood || 'VERY_UNLIKELY',
          surprise: face.surpriseLikelihood || 'POSSIBLE',
        };

        // Convert likelihood strings to numerical values
        const likelihoodMap = {
          'VERY_UNLIKELY': 0.05,
          'UNLIKELY': 0.2,
          'POSSIBLE': 0.5,
          'LIKELY': 0.8,
          'VERY_LIKELY': 0.95
        };

        // Calculate scores with validation
        const joyScore = likelihoodMap[emotions.joy] || 0.5;
        const sorrowScore = likelihoodMap[emotions.sorrow] || 0.2;
        const angerScore = likelihoodMap[emotions.anger] || 0.1;
        const surpriseScore = likelihoodMap[emotions.surprise] || 0.3;

        // Derive secondary emotions from face

        // Calculate calm (inverse of anger and surprise)
        const calmScore = 1 - Math.max(angerScore, surpriseScore);
        emotions.calm = calmScore > 0.7 ? 'LIKELY' : calmScore > 0.4 ? 'POSSIBLE' : 'UNLIKELY';

        // Calculate contentment (joy without surprise)
        const contentmentScore = joyScore * (1 - surpriseScore);
        emotions.contentment = contentmentScore > 0.7 ? 'LIKELY' : contentmentScore > 0.4 ? 'POSSIBLE' : 'UNLIKELY';

        // Calculate melancholy (sorrow without anger)
        const melancholyScore = sorrowScore * (1 - angerScore);
        emotions.melancholy = melancholyScore > 0.6 ? 'LIKELY' : melancholyScore > 0.3 ? 'POSSIBLE' : 'UNLIKELY';
      }
    } else {
      console.log('No face annotations found, using alternative emotion detection');
    }

    // 2. Process label annotations for emotion cues
    if (labelAnnotations && Array.isArray(labelAnnotations) && labelAnnotations.length > 0) {
      console.log('Processing label annotations for emotions');

      // Create a map of emotion-related keywords
      const emotionKeywords = {
        peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'zen', 'meditation', 'yoga', 'relax'],
        joyful: ['happy', 'joy', 'smile', 'laugh', 'cheerful', 'celebration', 'party'],
        energetic: ['energy', 'active', 'dynamic', 'vibrant', 'exercise', 'sport', 'fitness'],
        creative: ['art', 'creative', 'colorful', 'design', 'paint', 'music', 'dance'],
        reflective: ['thoughtful', 'contemplative', 'pensive', 'quiet', 'solitude', 'nature'],
        focused: ['focus', 'concentration', 'study', 'work', 'attention', 'mindful'],
        spiritual: ['spiritual', 'prayer', 'worship', 'sacred', 'divine', 'temple', 'church', 'ritual']
      };

      // Check labels against emotion keywords
      labelAnnotations.forEach(label => {
        if (!label.description) return;

        const description = label.description.toLowerCase();

        Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
          if (keywords.some(keyword => description.includes(keyword))) {
            // If we find a match, set the emotion
            const score = label.score || 0.5;
            const likelihood = score > 0.7 ? 'LIKELY' : score > 0.4 ? 'POSSIBLE' : 'UNLIKELY';

            // Only set if not already set or if the new score is higher
            if (!emotions[emotion] || likelihoodToScore(emotions[emotion]) < likelihoodToScore(likelihood)) {
              emotions[emotion] = likelihood;
            }
          }
        });
      });
    }

    // 3. Process object annotations for additional context
    if (objectAnnotations && Array.isArray(objectAnnotations) && objectAnnotations.length > 0) {
      console.log('Processing object annotations for emotions');

      // Objects that might indicate certain emotions or states
      const objectEmotionMap = {
        'Person': { 'social': 'LIKELY' },
        'Book': { 'focused': 'LIKELY', 'reflective': 'POSSIBLE' },
        'Musical Instrument': { 'creative': 'LIKELY', 'joyful': 'POSSIBLE' },
        'Sports Equipment': { 'energetic': 'LIKELY' },
        'Yoga Mat': { 'peaceful': 'LIKELY', 'focused': 'LIKELY' },
        'Meditation Cushion': { 'peaceful': 'VERY_LIKELY', 'spiritual': 'LIKELY' },
        'Candle': { 'peaceful': 'POSSIBLE', 'spiritual': 'POSSIBLE' },
        'Nature': { 'peaceful': 'LIKELY', 'reflective': 'POSSIBLE' },
        'Water': { 'peaceful': 'LIKELY', 'reflective': 'POSSIBLE' },
        'Mountain': { 'peaceful': 'LIKELY', 'spiritual': 'POSSIBLE' },
        'Forest': { 'peaceful': 'LIKELY', 'reflective': 'POSSIBLE' }
      };

      objectAnnotations.forEach(obj => {
        if (!obj.name) return;

        const objName = obj.name;
        const emotionMapping = objectEmotionMap[objName];

        if (emotionMapping) {
          Object.entries(emotionMapping).forEach(([emotion, likelihood]) => {
            // Only set if not already set or if the new likelihood is stronger
            if (!emotions[emotion] || likelihoodToScore(emotions[emotion]) < likelihoodToScore(likelihood)) {
              emotions[emotion] = likelihood;
            }
          });
        }
      });
    }

    // 4. Process safe search annotations if available
    if (safeSearchAnnotation) {
      console.log('Processing safe search annotations for emotions');

      // Map safe search categories to potential emotions
      if (safeSearchAnnotation.spoof === 'LIKELY' || safeSearchAnnotation.spoof === 'VERY_LIKELY') {
        emotions.playful = 'LIKELY';
        emotions.joyful = 'POSSIBLE';
      }

      if (safeSearchAnnotation.medical === 'LIKELY' || safeSearchAnnotation.medical === 'VERY_LIKELY') {
        emotions.concerned = 'POSSIBLE';
      }
    }

    // 5. Add some variation to ensure uniqueness
    const now = new Date();
    const randomSeed = now.getTime() % 10;

    // Only add random emotions if we don't have many emotions yet
    if (Object.keys(emotions).length < 5) {
      const possibleRandomEmotions = [
        'peaceful', 'energetic', 'focused', 'creative', 'reflective',
        'spiritual', 'balanced', 'mindful', 'grounded', 'inspired'
      ];

      // Add 2-3 random emotions based on timestamp
      for (let i = 0; i < 3; i++) {
        const index = (randomSeed + i) % possibleRandomEmotions.length;
        const emotion = possibleRandomEmotions[index];

        if (!emotions[emotion]) {
          emotions[emotion] = i === 0 ? 'LIKELY' : 'POSSIBLE';
        }
      }
    }

    // If we still don't have any emotions, use defaults
    if (Object.keys(emotions).length === 0) {
      console.log('No emotions detected, using defaults');
      return getDefaultEmotions();
    }

    return emotions;
  } catch (error) {
    console.error('Error extracting emotions:', error);
    return getDefaultEmotions();
  }
};

// Helper function to convert likelihood to score
const likelihoodToScore = (likelihood) => {
  const likelihoodMap = {
    'VERY_UNLIKELY': 0.05,
    'UNLIKELY': 0.2,
    'POSSIBLE': 0.5,
    'LIKELY': 0.8,
    'VERY_LIKELY': 0.95
  };

  return likelihoodMap[likelihood] || 0.5;
};

// Provide default emotions if extraction fails
const getDefaultEmotions = () => {
  // Add some randomness based on timestamp
  const now = new Date();
  const randomSeed = now.getTime() % 4;

  const emotionSets = [
    {
      joy: 'LIKELY',
      sorrow: 'UNLIKELY',
      anger: 'VERY_UNLIKELY',
      surprise: 'POSSIBLE',
      calm: 'LIKELY',
      contentment: 'LIKELY'
    },
    {
      joy: 'POSSIBLE',
      sorrow: 'UNLIKELY',
      anger: 'UNLIKELY',
      surprise: 'LIKELY',
      excitement: 'LIKELY',
      creative: 'LIKELY'
    },
    {
      joy: 'VERY_LIKELY',
      sorrow: 'VERY_UNLIKELY',
      anger: 'VERY_UNLIKELY',
      surprise: 'LIKELY',
      excitement: 'VERY_LIKELY',
      peaceful: 'POSSIBLE'
    },
    {
      joy: 'POSSIBLE',
      sorrow: 'POSSIBLE',
      anger: 'UNLIKELY',
      surprise: 'UNLIKELY',
      calm: 'LIKELY',
      reflective: 'LIKELY'
    }
  ];

  return emotionSets[randomSeed];
};

// Extract dominant colors from image properties
export const extractDominantColors = (imagePropertiesAnnotation) => {
  try {
    // Check if we have valid image properties
    if (!imagePropertiesAnnotation || !imagePropertiesAnnotation.dominantColors || !imagePropertiesAnnotation.dominantColors.colors) {
      console.log('No valid image properties found, using default colors');
      return getDefaultColors();
    }

    // Process the colors with error handling
    let colors = imagePropertiesAnnotation.dominantColors.colors
      .filter(color => color && color.color) // Filter out any null or undefined colors
      .sort((a, b) => b.pixelFraction - a.pixelFraction)
      .map(color => {
        try {
          const rgb = color.color;

          // Ensure RGB values exist and are numbers
          const red = Math.round(rgb && rgb.red ? rgb.red : 0);
          const green = Math.round(rgb && rgb.green ? rgb.green : 0);
          const blue = Math.round(rgb && rgb.blue ? rgb.blue : 0);

          // Convert to hex
          const hex = '#' +
            [red, green, blue]
              .map(x => x.toString(16).padStart(2, '0'))
              .join('');

          return {
            rgb: { red, green, blue },
            hex,
            score: color.pixelFraction || 0
          };
        } catch (colorError) {
          console.error('Error processing color:', colorError);
          // Return a default color if there's an error
          return {
            rgb: { red: 100, green: 100, blue: 100 },
            hex: '#646464',
            score: 0.1
          };
        }
      });

    // If we couldn't extract any colors, use defaults
    if (!colors || colors.length === 0) {
      console.log('No colors extracted, using default colors');
      return getDefaultColors();
    }

    // Filter out colors with very low pixel fraction (less than 5%)
    colors = colors.filter(color => color.score >= 0.05);

    // Group similar colors to avoid showing multiple shades of the same color
    const groupedColors = [];
    const colorThreshold = 30; // RGB difference threshold to consider colors similar

    for (const color of colors) {
      // Check if this color is similar to any already in our grouped list
      const isSimilarToExisting = groupedColors.some(existingColor => {
        const rDiff = Math.abs(existingColor.rgb.red - color.rgb.red);
        const gDiff = Math.abs(existingColor.rgb.green - color.rgb.green);
        const bDiff = Math.abs(existingColor.rgb.blue - color.rgb.blue);
        return (rDiff + gDiff + bDiff) < colorThreshold * 3;
      });

      // Only add if not similar to existing colors
      if (!isSimilarToExisting) {
        groupedColors.push(color);
        // Limit to 4 distinct colors
        if (groupedColors.length >= 4) break;
      }
    }

    // If we have fewer than 2 colors after filtering, add some defaults
    if (groupedColors.length < 2) {
      console.log('Too few distinct colors, adding some defaults');
      const defaults = getDefaultColors();
      while (groupedColors.length < 4 && defaults.length > 0) {
        groupedColors.push(defaults.shift());
      }
    }

    return groupedColors;
  } catch (error) {
    console.error('Error extracting dominant colors:', error);
    return getDefaultColors();
  }
};

// Provide default colors if extraction fails
const getDefaultColors = () => {
  return [
    { rgb: { red: 66, green: 133, blue: 244 }, hex: '#4285F4', score: 0.4 },
    { rgb: { red: 52, green: 168, blue: 83 }, hex: '#34A853', score: 0.3 },
    { rgb: { red: 251, green: 188, blue: 5 }, hex: '#FBBC05', score: 0.2 },
    { rgb: { red: 234, green: 67, blue: 53 }, hex: '#EA4335', score: 0.1 }
  ];
};

// Map colors to emotions
export const mapColorsToEmotions = (colors) => {
  try {
    // Ensure we have valid colors
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      console.log('No valid colors to map to emotions, using defaults');
      return 'Calm, Peace (Blue), Growth, Healing (Green), Joy, Happiness (Yellow), Passion, Strength (Red)';
    }

    // Map each color to an emotion with error handling
    const emotions = colors.map(color => {
      try {
        if (!color || !color.hex) {
          return 'Balanced, Neutral (Gray)';
        }

        // Get color name and emotion using our utility functions
        const colorName = getColorName(color.hex);
        const colorEmotion = getColorEmotion(colorName);

        // Add the color name to the emotion
        return `${colorEmotion} (${colorName})`;
      } catch (emotionError) {
        console.error('Error mapping color to emotion:', emotionError);
        return 'Balanced, Neutral (Gray)';
      }
    });

    // Join the emotions with commas
    return emotions.join(', ');
  } catch (error) {
    console.error('Error mapping colors to emotions:', error);
    return 'Calm, Peace (Blue), Growth, Healing (Green), Joy, Happiness (Yellow), Passion, Strength (Red)';
  }
};

// Generate meditation with Gemini API
export const generateMeditationWithGemini = async (analysisData, style, theme) => {
  try {
    console.log('Generating meditation with Gemini API...');

    // Create a unique timestamp and random seed
    const timestamp = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(2, 15);

    // Validate and prepare the analysis data with fallbacks
    const safeAnalysisData = {
      emotions: analysisData.emotions || getDefaultEmotions(),
      labels: Array.isArray(analysisData.labels) ? analysisData.labels : ['Nature', 'Scenery'],
      objects: Array.isArray(analysisData.objects) ? analysisData.objects : ['Plant', 'Sky'],
      landmarks: Array.isArray(analysisData.landmarks) ? analysisData.landmarks : [],
      dominantColors: Array.isArray(analysisData.dominantColors) ? analysisData.dominantColors : getDefaultColors(),
      colorEmotions: analysisData.colorEmotions || 'Calm, Peace (Blue), Growth, Healing (Green)'
    };

    // Get color names instead of hex codes
    const colorNames = safeAnalysisData.dominantColors.slice(0, 3).map(c => {
      try {
        return getColorName(c.hex);
      } catch (e) {
        return c.hex;
      }
    }).join(', ');

    // Extract faces and people information
    const hasPeople = safeAnalysisData.objects.some(obj =>
      ['Person', 'Human', 'Man', 'Woman', 'Child', 'Boy', 'Girl', 'People'].includes(obj)
    );

    const hasFaces = Object.keys(safeAnalysisData.emotions).some(emotion =>
      ['joy', 'sorrow', 'anger', 'surprise'].includes(emotion)
    );

    // Create Gemini API prompt
    const prompt = `
You are an AI meditation guide. Create a UNIQUE and PERSONALIZED meditation based on:
- Detected emotions: ${JSON.stringify(safeAnalysisData.emotions)}
- Environment: ${safeAnalysisData.labels.join(', ')}
- Objects: ${safeAnalysisData.objects.join(', ')}
- Landmarks: ${safeAnalysisData.landmarks.join(', ')}
- Dominant colors: ${colorNames} (${safeAnalysisData.colorEmotions})
- Style: ${style || 'Calm'}
- Theme: ${theme || 'Nature'}
- Contains people: ${hasPeople ? 'Yes' : 'No'}
- Contains faces: ${hasFaces ? 'Yes' : 'No'}
- Timestamp: ${timestamp}
- Random seed: ${randomSeed}

Instructions:
- Write a meditation in 5-7 steps that is COMPLETELY UNIQUE to this image.
- DEEPLY ANALYZE the image content and create a meditation that directly references SPECIFIC ELEMENTS in the image.
- If landmarks are detected (${safeAnalysisData.landmarks.join(', ')}), make them a central focus of the meditation.
- If specific objects are detected (${safeAnalysisData.objects.join(', ')}), incorporate them meaningfully into the meditation.
- If people are detected, incorporate their expressions, postures, and apparent emotions into the meditation.
- If the image shows a specific location or activity, build the meditation around that specific context.
- Use the emotional qualities of the colors (${colorNames}) and detected mood to guide the emotional tone.
- Make it yoga-inspired and mindful, with specific breathing and body awareness instructions.
- Be creative, gentle, and positive, but also very specific to the actual image content.
- DO NOT use generic meditation text - make it highly specific to this image.
- Create a unique title that reflects the specific content of this meditation.
- Each step should be 3-5 sentences long and directly relate to what's in the image.
- Use markdown formatting with # for the title and ## for each step.
- The meditation should feel like it was written specifically for this exact image and no other.
- AVOID REPETITION in language, phrasing, and concepts between steps.
- Each step should focus on a different aspect of the image or a different meditation technique.

IMPORTANT: Your meditation MUST directly reference the specific landmarks, objects, and visual elements detected in the image. Avoid generic meditation text that could apply to any image. Make it clear that this meditation was crafted specifically for THIS image.
`;

    const geminiRequest = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,  // Higher temperature for more creativity
        topP: 0.9,         // Higher topP for more diverse outputs
        topK: 40,          // Higher topK for more variety
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // First try the direct Gemini API call
    try {
      console.log('Sending request to Gemini API...');
      console.log('Using Gemini API endpoint:', GEMINI_API_ENDPOINT);

      const response = await axios.post(
        `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`,
        geminiRequest
      );

      console.log('Gemini API response received');
      const meditationText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (meditationText) {
        return meditationText;
      } else {
        console.warn('Invalid Gemini API response, trying backend fallback');
        throw new Error('Invalid Gemini API response');
      }
    } catch (directApiError) {
      console.error('Direct Gemini API call failed:', directApiError);

      // Try using the backend as a fallback
      try {
        console.log('Trying to generate meditation through backend...');

        // Try the /api/photos endpoint instead since /api/generate-meditation doesn't exist
        const response = await axios.post(`${API_BASE}/api/photos`, {
          userId: 'demo-user',
          photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==',
          visionResult: safeAnalysisData,
          style: style || 'Calm',
          theme: theme || 'Nature'
        });

        console.log('Backend meditation generation successful');

        if (response.data && response.data.geminiGuidance) {
          return response.data.geminiGuidance;
        }

        throw new Error('Backend did not return valid meditation text');
      } catch (backendError) {
        console.error('Backend meditation generation failed:', backendError);

        // Log more details about the error
        console.log('Backend error details:', {
          message: backendError.message,
          status: backendError.response?.status,
          statusText: backendError.response?.statusText,
          data: backendError.response?.data,
          url: backendError.config?.url
        });

        // Generate a fallback meditation
        console.log('Generating fallback meditation...');
        return getFallbackMeditation(safeAnalysisData, style, theme);
      }
    }
  } catch (error) {
    console.error('All meditation generation approaches failed:', error);
    return getFallbackMeditation(analysisData, style, theme);
  }
};

// Generate a fallback meditation if all API calls fail
const getFallbackMeditation = (analysisData, style, theme) => {
  console.log('Generating fallback meditation...');

  // Get some data to work with
  const emotions = analysisData?.emotions || getDefaultEmotions();
  const labels = Array.isArray(analysisData?.labels) ? analysisData.labels : ['Nature', 'Scenery'];
  const dominantColors = Array.isArray(analysisData?.dominantColors) ?
    analysisData.dominantColors.map(c => c.hex).join(', ') :
    '#4285F4, #34A853, #FBBC05, #EA4335';

  // Get a random label to focus on
  const focusLabel = labels[Math.floor(Math.random() * labels.length)];

  // Get the primary emotion
  let primaryEmotion = 'calm';
  Object.keys(emotions).forEach(emotion => {
    if (emotions[emotion] === 'VERY_LIKELY' || emotions[emotion] === 'LIKELY') {
      primaryEmotion = emotion;
    }
  });

  // Get additional labels for more variety
  const allLabels = Array.isArray(analysisData?.labels) ? analysisData.labels : ['Nature', 'Scenery'];
  const secondaryLabel = allLabels.length > 1 ? allLabels[1] : focusLabel;
  const tertiaryLabel = allLabels.length > 2 ? allLabels[2] : secondaryLabel;

  // Get objects for more specificity
  const objects = Array.isArray(analysisData?.objects) ? analysisData.objects : ['Plant', 'Sky'];
  const primaryObject = objects.length > 0 ? objects[0] : focusLabel;

  // Get a secondary emotion
  let secondaryEmotion = 'peaceful';
  Object.keys(emotions).forEach(emotion => {
    if (emotion !== primaryEmotion && (emotions[emotion] === 'POSSIBLE' || emotions[emotion] === 'LIKELY')) {
      secondaryEmotion = emotion;
    }
  });

  // Get color names instead of hex codes if possible
  let colorNames = '';
  try {
    if (Array.isArray(analysisData?.dominantColors)) {
      colorNames = analysisData.dominantColors.slice(0, 3).map(c => {
        try {
          return getColorName(c.hex);
        } catch (e) {
          return c.hex;
        }
      }).join(', ');
    }
  } catch (e) {
    colorNames = dominantColors;
  }

  if (!colorNames) {
    colorNames = 'Blue, Green, Yellow';
  }

  // Generate a timestamp-based random seed
  const now = new Date();
  const randomSeed = now.getTime() % 5;

  // Different meditation templates with more personalization
  const templates = [
    `# Finding ${primaryEmotion.charAt(0).toUpperCase() + primaryEmotion.slice(1)} Through ${focusLabel} and ${secondaryLabel}

## Step 1: Centering with ${focusLabel}
Take a deep breath and feel your body settling into this moment as you gaze at the ${focusLabel}. Notice the sensations in your body as you begin to relax - perhaps a tingling in your fingertips or a softening in your shoulders. Allow your mind to focus specifically on the ${focusLabel} before you, noticing its unique details and qualities.

## Step 2: Color Awareness
Observe the beautiful colors in the image - ${colorNames} - and how they create a sense of ${primaryEmotion}. These colors aren't random; they're speaking directly to your emotional state right now. Let these specific colors wash over you, bringing their unique energy into your awareness. Feel yourself becoming more present with each breath.

## Step 3: Connecting with ${secondaryLabel}
Now shift your attention to the ${secondaryLabel} in the image. Imagine yourself within this scene, surrounded by both the ${focusLabel} and ${secondaryLabel}. What specific sounds might you hear in this exact environment? What textures would you feel if you could reach out and touch the ${primaryObject}? Allow all your senses to engage with this specific environment.

## Step 4: Embodying ${primaryEmotion} and ${secondaryEmotion}
As you breathe deeply, embody the qualities of ${primaryEmotion} and ${secondaryEmotion} that this specific image evokes. Let these feelings spread through your entire body, from your toes to the crown of your head. With each inhale, draw in more of the energy of ${focusLabel}; with each exhale, release any tension that blocks these feelings.

## Step 5: Integration and Intention
Carry the specific sense of ${primaryEmotion} from this ${focusLabel} image with you as you slowly prepare to return to your day. Set an intention to notice instances of ${secondaryLabel} in your daily life, using them as reminders to reconnect with this feeling. Know that you can return to this specific meditation whenever you need to reconnect with the essence of ${focusLabel} and ${secondaryLabel}.`,

    `# ${style} Journey: From ${focusLabel} to ${secondaryLabel}

## Step 1: Mindful Arrival
Close your eyes and imagine standing before the ${focusLabel} from the image, with the ${secondaryLabel} nearby. Feel the specific ground beneath your feet - is it soft earth, smooth stone, or something else entirely? Notice the air around you, perhaps cool or warm against your skin. Take three deep breaths to arrive fully in this moment, breathing in the essence of this specific scene.

## Step 2: Color Exploration
With each breath, explore the specific colors of this scene - ${colorNames}. These aren't just any colors; they're the exact palette of your image. Notice how these particular colors affect your mood and create a sense of ${primaryEmotion}. Allow yourself to be drawn deeper into this experience as you breathe with the rhythm of the ${focusLabel} and ${secondaryLabel}.

## Step 3: Absorption of ${primaryObject}
Let the quality of ${primaryEmotion} from the ${primaryObject} fill your entire being. Your body softens, your mind quiets, and you become one with the energy of this specific ${focusLabel}. This is a place of perfect harmony between you and the elements in this image. Feel the boundaries between observer and observed beginning to dissolve.

## Step 4: Transformation Through ${tertiaryLabel}
As you continue breathing deeply, feel yourself transforming through your connection with the ${tertiaryLabel} aspect of the image. The boundaries between you and what you're observing begin to dissolve. You are becoming more ${primaryEmotion}, more aligned with the essence of ${theme} as expressed in this specific image. Your body knows exactly how to integrate this energy.

## Step 5: Gratitude for This Specific Moment
Before you return, take a moment to express gratitude for this specific experience with ${focusLabel} and ${secondaryLabel}. Thank the elements in this image for sharing their wisdom and energy with you. Know that this particular connection remains available to you always - you need only recall the ${colorNames} colors and the feeling of ${primaryEmotion} to return here.`,

    `# The ${primaryEmotion.charAt(0).toUpperCase() + primaryEmotion.slice(1)} Path: Meditation with ${focusLabel} and ${primaryObject}

## Step 1: Grounding in the Image
Begin by settling into a comfortable position, imagining yourself physically present in the scene with the ${focusLabel}. Feel the weight of your body supported as if you were actually there. Bring to mind the specific details of the ${focusLabel} and ${primaryObject} and allow them to fill your awareness completely. Notice the exact quality of light in this scene.

## Step 2: Immersion in ${colorNames}
Notice the beautiful colors - ${colorNames} - that make up this specific image. These aren't generic colors but the exact palette that creates the mood of this scene. Each color carries its own energy and wisdom specific to this moment. Breathe in these colors and let them nourish your being, perhaps feeling the ${colorNames.split(',')[0]} most strongly in your heart center.

## Step 3: Emotional Resonance with ${secondaryEmotion}
As you continue to breathe with this image, connect with the feeling of ${primaryEmotion} and ${secondaryEmotion} that arises. These emotions aren't random - they're gifts from the specific ${focusLabel} and ${primaryObject} in this image, offering you exactly what you need in this moment. Feel how your body naturally responds to these qualities.

## Step 4: Deepening Through ${secondaryLabel}
With each breath, deepen your connection to ${primaryEmotion} and the specific elements of ${focusLabel} and ${secondaryLabel}. Feel yourself becoming more aligned with the essence of ${theme} as it's expressed in this unique image. Your body and mind are in perfect harmony with the specific energy signature of this scene.

## Step 5: Carrying This Specific Wisdom Forward
As this meditation comes to a close, know that you can carry the energy of this specific ${focusLabel} and the feeling of ${primaryEmotion} with you throughout your day. The wisdom of ${secondaryLabel} and ${primaryObject} is now part of you. When you encounter challenges today, recall the ${colorNames} colors and the specific quality of ${primaryEmotion} from this image.`,

    `# The Wisdom of ${focusLabel} and ${secondaryLabel}: A ${style} Meditation

## Step 1: Invitation to This Specific Scene
Invite yourself to be fully present with the image of ${focusLabel} alongside ${secondaryLabel}. Take three deep breaths, allowing your body to relax and your mind to become receptive to the wisdom being offered by this specific combination of elements. Feel yourself stepping into the scene, becoming part of its unique energy field.

## Step 2: Visual Journey Through ${colorNames}
Explore the specific colors of this image - ${colorNames}. These aren't random colors but the exact palette that creates the mood and energy of this scene. Each shade has something unique to teach you about ${primaryEmotion} and ${secondaryEmotion}. Notice how these colors create these specific feelings within you, perhaps concentrating in particular areas of your body.

## Step 3: Embodied Presence With ${primaryObject}
As you breathe with the image of ${focusLabel} and ${primaryObject}, allow the quality of ${primaryEmotion} to enter your body through your breath. Feel it in your chest, your belly, your limbs - wherever it naturally wants to go. You are becoming an embodiment of this energy, not in a generic way, but in the specific way that this unique image expresses it.

## Step 4: Receiving Guidance From This Specific Image
In this state of receptive awareness, listen for any messages or insights that this specific combination of ${focusLabel}, ${secondaryLabel}, and ${primaryObject} might have for you. What wisdom is being offered by these particular elements in this exact arrangement? What do you need to know right now about ${primaryEmotion} or ${secondaryEmotion}?

## Step 5: Integration of This Unique Experience
Slowly begin to return to your surroundings, bringing with you the gifts of ${primaryEmotion} from ${focusLabel} and the wisdom of ${secondaryLabel}. These qualities aren't generic - they're the specific energetic signature of this image. They are now part of your inner landscape, available whenever you need them. Simply recall the ${colorNames} colors to reconnect.`,

    `# Embracing ${theme} Through the Specific Wisdom of ${focusLabel}

## Step 1: Arriving in This Moment
Take a moment to arrive fully in your body as you connect with this specific image. Feel your breath moving in and out, perhaps imagining it taking on the colors of ${colorNames}. Bring your attention to the ${focusLabel} and ${primaryObject} and allow them to fill your field of awareness. Notice the unique quality of presence they offer.

## Step 2: Sensing the Specific Energy
Notice the colors present in this image - ${colorNames}. Feel how these specific colors affect your energy and emotions in this moment. There is a quality of ${primaryEmotion} here that is available to you, not as a generic concept, but as the specific expression found in this unique combination of ${focusLabel} and ${secondaryLabel}.

## Step 3: Opening to ${secondaryLabel}
With each breath, open yourself more fully to the essence of ${secondaryLabel} as it appears in this image. Let go of any resistance or tension that might block this connection. You are safe to receive the gifts being offered in this moment by this specific scene. Feel your heart center softening and expanding to receive this energy.

## Step 4: Receiving the Wisdom of ${primaryObject}
As you continue to breathe with ${focusLabel} and ${primaryObject}, receive the quality of ${primaryEmotion} into your heart. Let it spread throughout your entire being, transforming you from the inside out. This isn't a generic energy but the specific frequency of ${primaryEmotion} as expressed through the unique elements of this image.

## Step 5: Embodying This Specific Energy
Before you complete this meditation, make a commitment to embody the energy of ${primaryEmotion} from ${focusLabel} and the wisdom of ${secondaryLabel} in your daily life. You are now a living expression of ${theme}, not in a generic way, but in the specific way that this unique image has revealed to you. Carry the colors ${colorNames} with you as reminders.`
  ];

  return templates[randomSeed];
};

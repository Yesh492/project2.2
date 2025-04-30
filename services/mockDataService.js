// mockDataService.js - Provides mock data when Firestore is unavailable

// Generate a random ID
const generateId = (prefix = 'mock') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Sample meditation images (yoga and meditation themed)
const sampleImages = [
  '/images/meditation1.jpg',
  '/images/meditation2.jpg',
  '/images/yoga1.jpg',
  '/images/yoga2.jpg',
  // Fallback to offline images
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  'https://images.unsplash.com/photo-1532798442725-41036acc7489?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
];

// Sample emotions
const sampleEmotions = [
  { joy: 'LIKELY', sorrow: 'UNLIKELY', anger: 'VERY_UNLIKELY', surprise: 'POSSIBLE', calm: 'LIKELY', contentment: 'LIKELY' },
  { joy: 'VERY_LIKELY', sorrow: 'VERY_UNLIKELY', anger: 'VERY_UNLIKELY', surprise: 'UNLIKELY', calm: 'VERY_LIKELY', contentment: 'VERY_LIKELY' },
  { joy: 'POSSIBLE', sorrow: 'POSSIBLE', anger: 'UNLIKELY', surprise: 'UNLIKELY', calm: 'LIKELY', contentment: 'POSSIBLE' },
  { joy: 'UNLIKELY', sorrow: 'LIKELY', anger: 'UNLIKELY', surprise: 'UNLIKELY', calm: 'POSSIBLE', contentment: 'UNLIKELY' }
];

// Sample labels
const sampleLabels = [
  ['Meditation', 'Yoga', 'Wellness', 'Calm', 'Nature'],
  ['Relaxation', 'Mindfulness', 'Peace', 'Spirituality', 'Health'],
  ['Balance', 'Harmony', 'Tranquility', 'Zen', 'Focus'],
  ['Energy', 'Vitality', 'Strength', 'Flexibility', 'Breath']
];

// Sample colors
const sampleColors = [
  [
    { hex: '#4682B4', category: 'blue', isLight: false, score: 0.4, colorEmotions: 'Calm, Peace, Tranquility (Blue)' },
    { hex: '#2E8B57', category: 'green', isLight: false, score: 0.3, colorEmotions: 'Growth, Healing, Renewal (Green)' },
    { hex: '#F5F5DC', category: 'neutral', isLight: true, score: 0.2, colorEmotions: 'Purity, Clarity, Simplicity (White)' }
  ],
  [
    { hex: '#8B4513', category: 'brown', isLight: false, score: 0.35, colorEmotions: 'Stability, Reliability, Earthiness (Brown)' },
    { hex: '#006400', category: 'green', isLight: false, score: 0.3, colorEmotions: 'Abundance, Nature, Harmony (Dark Green)' },
    { hex: '#F0E68C', category: 'yellow', isLight: true, score: 0.25, colorEmotions: 'Cheerfulness, Intellect, Honor (Khaki)' }
  ],
  [
    { hex: '#4B0082', category: 'purple', isLight: false, score: 0.3, colorEmotions: 'Intuition, Mysticism, Dignity (Indigo)' },
    { hex: '#000080', category: 'blue', isLight: false, score: 0.3, colorEmotions: 'Introspection, Intuition, Wisdom (Navy Blue)' },
    { hex: '#F5F5F5', category: 'neutral', isLight: true, score: 0.2, colorEmotions: 'Purity, Clarity, Simplicity (White)' }
  ]
];

// Sample meditation guidance
const sampleGuidance = [
  "I notice a sense of calm and balance in your image. Take a moment to breathe deeply, allowing your shoulders to relax with each exhale. Focus on the sensation of your breath moving through your body, bringing peace to any areas of tension. As you continue breathing, visualize a gentle blue light surrounding you, creating a protective and tranquil space.",
  
  "Your image reflects a strong connection to nature and growth. Begin by standing tall, feeling your feet firmly planted on the ground. Imagine roots extending from your feet deep into the earth, drawing up nourishing energy. As you inhale, visualize this energy flowing up through your body, and as you exhale, release any thoughts or feelings that no longer serve you.",
  
  "I sense a need for balance and harmony in your image. Start by finding a comfortable seated position and gently close your eyes. Place your hands on your knees, palms facing upward in a receptive gesture. Focus on the center of your chest, your heart space, and with each breath, imagine a warm, golden light expanding outward, bringing equilibrium to your mind and body.",
  
  "Your image suggests a journey of introspection and wisdom. Begin by creating a quiet space for yourself, free from distractions. Sit comfortably and bring your attention to the space between your eyebrows. With each inhale, imagine drawing in clarity and insight, and with each exhale, release doubt and confusion. Allow your thoughts to come and go without judgment, observing them like clouds passing in the sky."
];

// Generate a mock meditation
const generateMockMeditation = (userId = 'demo-user', index = null) => {
  const randomIndex = index !== null ? index % 4 : Math.floor(Math.random() * 4);
  const timestamp = Date.now() - (randomIndex * 86400000); // Spread out timestamps
  
  return {
    id: generateId('meditation'),
    userId: userId,
    photoUrl: sampleImages[randomIndex % sampleImages.length],
    createdAt: new Date(timestamp),
    clientTimestamp: timestamp,
    style: ['Calm', 'Energetic', 'Focused', 'Balanced'][randomIndex % 4],
    theme: ['Nature', 'Ocean', 'Mountain', 'Forest'][randomIndex % 4],
    visionResult: {
      emotions: sampleEmotions[randomIndex % sampleEmotions.length],
      labels: sampleLabels[randomIndex % sampleLabels.length],
      dominantColors: sampleColors[randomIndex % sampleColors.length],
      colorEmotions: sampleColors[randomIndex % sampleColors.length][0].colorEmotions
    },
    geminiGuidance: sampleGuidance[randomIndex % sampleGuidance.length]
  };
};

// Mock Firestore service functions
export const mockSaveMeditation = async (meditationData) => {
  console.log('Using mock data service to save meditation');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockId = generateId('meditation');
  
  // Store in localStorage as fallback
  try {
    const existingMeditations = JSON.parse(localStorage.getItem('mockMeditations') || '[]');
    const newMeditation = {
      id: mockId,
      userId: meditationData.userId || 'demo-user',
      photoUrl: meditationData.photoUrl || sampleImages[0],
      geminiGuidance: meditationData.geminiGuidance || sampleGuidance[0],
      createdAt: new Date().toISOString(),
      clientTimestamp: Date.now(),
      style: meditationData.style || 'Calm',
      theme: meditationData.theme || 'Nature',
      visionResult: meditationData.visionResult || {
        emotions: sampleEmotions[0],
        labels: sampleLabels[0],
        dominantColors: sampleColors[0]
      }
    };
    
    existingMeditations.push(newMeditation);
    localStorage.setItem('mockMeditations', JSON.stringify(existingMeditations));
    console.log('Saved mock meditation to localStorage:', mockId);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  return mockId;
};

export const mockGetMeditationsForUser = async (userId = 'demo-user') => {
  console.log('Using mock data service to get meditations for user:', userId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Try to get from localStorage first
  try {
    const storedMeditations = JSON.parse(localStorage.getItem('mockMeditations') || '[]');
    if (storedMeditations.length > 0) {
      console.log('Retrieved meditations from localStorage:', storedMeditations.length);
      return storedMeditations.filter(m => m.userId === userId);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Generate mock meditations if none in localStorage
  const mockMeditations = [];
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 meditations
  
  for (let i = 0; i < count; i++) {
    mockMeditations.push(generateMockMeditation(userId, i));
  }
  
  // Store in localStorage for future use
  try {
    localStorage.setItem('mockMeditations', JSON.stringify(mockMeditations));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  return mockMeditations;
};

export const mockGetMeditationById = async (meditationId) => {
  console.log('Using mock data service to get meditation by ID:', meditationId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Try to get from localStorage first
  try {
    const storedMeditations = JSON.parse(localStorage.getItem('mockMeditations') || '[]');
    const found = storedMeditations.find(m => m.id === meditationId);
    if (found) {
      console.log('Retrieved meditation from localStorage:', meditationId);
      return found;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Generate a mock meditation if not found
  return generateMockMeditation('demo-user', 0);
};

export const mockTrackImageUpload = async (imageData) => {
  console.log('Using mock data service to track image upload');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return generateId('upload');
};

export const mockUpdateImageAnalysis = async (uploadId, analysisData) => {
  console.log('Using mock data service to update image analysis:', uploadId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return true;
};

export default {
  saveMeditation: mockSaveMeditation,
  getMeditationsForUser: mockGetMeditationsForUser,
  getMeditationById: mockGetMeditationById,
  trackImageUpload: mockTrackImageUpload,
  updateImageAnalysis: mockUpdateImageAnalysis
};

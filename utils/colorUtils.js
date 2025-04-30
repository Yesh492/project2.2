/**
 * Utility functions for color analysis
 */

// Map of color names by hex code ranges
const colorNameMap = {
  // Reds
  '#ff0000': 'Red',
  '#cd5c5c': 'Indian Red',
  '#b22222': 'Firebrick',
  '#a52a2a': 'Brown',
  '#800000': 'Maroon',
  '#dc143c': 'Crimson',
  '#ff6347': 'Tomato',
  '#ff4500': 'Orange Red',

  // Oranges
  '#ffa500': 'Orange',
  '#ff8c00': 'Dark Orange',
  '#ff7f50': 'Coral',

  // Yellows
  '#ffff00': 'Yellow',
  '#ffd700': 'Gold',
  '#ffb6c1': 'Light Pink',
  '#ffc0cb': 'Pink',
  '#f0e68c': 'Khaki',

  // Greens
  '#008000': 'Green',
  '#006400': 'Dark Green',
  '#32cd32': 'Lime Green',
  '#00ff00': 'Lime',
  '#7cfc00': 'Lawn Green',
  '#00ff7f': 'Spring Green',
  '#00fa9a': 'Medium Spring Green',
  '#90ee90': 'Light Green',
  '#98fb98': 'Pale Green',
  '#8fbc8f': 'Dark Sea Green',
  '#3cb371': 'Medium Sea Green',
  '#2e8b57': 'Sea Green',
  '#228b22': 'Forest Green',
  '#808000': 'Olive',

  // Blues
  '#0000ff': 'Blue',
  '#000080': 'Navy',
  '#00008b': 'Dark Blue',
  '#0000cd': 'Medium Blue',
  '#4169e1': 'Royal Blue',
  '#1e90ff': 'Dodger Blue',
  '#00bfff': 'Deep Sky Blue',
  '#87ceeb': 'Sky Blue',
  '#87cefa': 'Light Sky Blue',
  '#4682b4': 'Steel Blue',
  '#b0c4de': 'Light Steel Blue',
  '#add8e6': 'Light Blue',
  '#5f9ea0': 'Cadet Blue',
  '#00ffff': 'Cyan',
  '#00ffff': 'Aqua',
  '#00ced1': 'Dark Turquoise',
  '#20b2aa': 'Light Sea Green',
  '#48d1cc': 'Medium Turquoise',
  '#40e0d0': 'Turquoise',
  '#afeeee': 'Pale Turquoise',
  '#7fffd4': 'Aquamarine',

  // Purples
  '#800080': 'Purple',
  '#4b0082': 'Indigo',
  '#8b008b': 'Dark Magenta',
  '#9400d3': 'Dark Violet',
  '#9932cc': 'Dark Orchid',
  '#8a2be2': 'Blue Violet',
  '#9370db': 'Medium Purple',
  '#ba55d3': 'Medium Orchid',
  '#ff00ff': 'Magenta',
  '#ff00ff': 'Fuchsia',
  '#da70d6': 'Orchid',
  '#ee82ee': 'Violet',
  '#dda0dd': 'Plum',
  '#d8bfd8': 'Thistle',

  // Browns
  '#a0522d': 'Sienna',
  '#8b4513': 'Saddle Brown',
  '#d2691e': 'Chocolate',
  '#cd853f': 'Peru',
  '#deb887': 'Burlywood',
  '#f4a460': 'Sandy Brown',
  '#d2b48c': 'Tan',

  // Whites
  '#ffffff': 'White',
  '#f5f5f5': 'White Smoke',
  '#fffafa': 'Snow',
  '#f0fff0': 'Honeydew',
  '#f5fffa': 'Mint Cream',
  '#f0ffff': 'Azure',
  '#f0f8ff': 'Alice Blue',
  '#f8f8ff': 'Ghost White',
  '#fffaf0': 'Floral White',
  '#fffff0': 'Ivory',
  '#faebd7': 'Antique White',
  '#faf0e6': 'Linen',
  '#fff5ee': 'Seashell',
  '#f5f5dc': 'Beige',
  '#fdf5e6': 'Old Lace',
  '#fffacd': 'Lemon Chiffon',
  '#fffacd': 'Cornsilk',
  '#ffebcd': 'Blanched Almond',
  '#ffe4c4': 'Bisque',
  '#ffe4b5': 'Moccasin',
  '#ffdead': 'Navajo White',
  '#ffdab9': 'Peach Puff',
  '#ffe4e1': 'Misty Rose',

  // Grays
  '#808080': 'Gray',
  '#696969': 'Dim Gray',
  '#778899': 'Light Slate Gray',
  '#708090': 'Slate Gray',
  '#a9a9a9': 'Dark Gray',
  '#c0c0c0': 'Silver',
  '#d3d3d3': 'Light Gray',
  '#dcdcdc': 'Gainsboro',

  // Blacks
  '#000000': 'Black',
  '#2f4f4f': 'Dark Slate Gray',
  '#4f4f4f': 'Dim Gray'
};

// Color emotional associations
const colorEmotions = {
  'Red': 'Passion, Energy, Strength',
  'Indian Red': 'Warmth, Earthiness',
  'Firebrick': 'Determination, Power',
  'Brown': 'Stability, Reliability, Earthiness',
  'Maroon': 'Confidence, Richness, Sophistication',
  'Crimson': 'Desire, Excitement, Love',
  'Tomato': 'Enthusiasm, Happiness',
  'Orange Red': 'Aggression, Confidence, Vigor',

  'Orange': 'Creativity, Enthusiasm, Warmth',
  'Dark Orange': 'Courage, Confidence, Friendliness',
  'Coral': 'Playfulness, Sociability, Stimulation',

  'Yellow': 'Happiness, Optimism, Energy',
  'Gold': 'Success, Achievement, Prosperity',
  'Light Pink': 'Sweetness, Tenderness, Romance',
  'Pink': 'Love, Compassion, Nurturing',
  'Khaki': 'Reliability, Stability, Earthiness',

  'Green': 'Growth, Harmony, Healing',
  'Dark Green': 'Abundance, Nature, Wealth',
  'Lime Green': 'Vitality, Freshness, Youth',
  'Lime': 'Energy, Vibrancy, Renewal',
  'Lawn Green': 'Freshness, Growth, Vitality',
  'Spring Green': 'Renewal, Growth, Rebirth',
  'Medium Spring Green': 'Healing, Freshness, Rejuvenation',
  'Light Green': 'Gentleness, Nurturing, Spring',
  'Pale Green': 'Calmness, Softness, Tranquility',
  'Dark Sea Green': 'Balance, Harmony, Stability',
  'Medium Sea Green': 'Prosperity, Health, Fertility',
  'Sea Green': 'Balance, Restoration, Endurance',
  'Forest Green': 'Abundance, Wealth, Prosperity',
  'Olive': 'Peace, Harmony, Earthiness',

  'Blue': 'Calm, Trust, Serenity',
  'Navy': 'Authority, Stability, Trust',
  'Dark Blue': 'Knowledge, Power, Integrity',
  'Medium Blue': 'Tranquility, Understanding, Patience',
  'Royal Blue': 'Nobility, Richness, Trust',
  'Dodger Blue': 'Joy, Youth, Energy',
  'Deep Sky Blue': 'Refreshment, Freedom, Inspiration',
  'Sky Blue': 'Peace, Tranquility, Openness',
  'Light Sky Blue': 'Serenity, Infinity, Possibility',
  'Steel Blue': 'Reliability, Stability, Depth',
  'Light Steel Blue': 'Harmony, Gentleness, Sophistication',
  'Light Blue': 'Health, Healing, Tranquility',
  'Cadet Blue': 'Calmness, Stability, Reliability',
  'Cyan': 'Refreshment, Coolness, Clarity',
  'Aqua': 'Purity, Cleanliness, Clarity',
  'Dark Turquoise': 'Clarity, Confidence, Strength',
  'Light Sea Green': 'Renewal, Healing, Protection',
  'Medium Turquoise': 'Tranquility, Clarity, Compassion',
  'Turquoise': 'Calmness, Clarity, Communication',
  'Pale Turquoise': 'Refreshment, Femininity, Gentleness',
  'Aquamarine': 'Youth, Hope, Health',

  'Purple': 'Spirituality, Imagination, Transformation',
  'Indigo': 'Intuition, Mysticism, Dignity',
  'Dark Magenta': 'Passion, Creativity, Spirituality',
  'Dark Violet': 'Intuition, Spiritual Awareness, Authenticity',
  'Dark Orchid': 'Creativity, Dignity, Independence',
  'Blue Violet': 'Intuition, Spirituality, Enchantment',
  'Medium Purple': 'Inspiration, Creativity, Mystery',
  'Medium Orchid': 'Enchantment, Whimsy, Tenderness',
  'Magenta': 'Harmony, Balance, Universal Love',
  'Fuchsia': 'Confidence, Assurance, Maturity',
  'Orchid': 'Refinement, Luxury, Charm',
  'Violet': 'Spirituality, Luxury, Authenticity',
  'Plum': 'Wisdom, Independence, Creativity',
  'Thistle': 'Spirituality, Nostalgia, Femininity',

  'Sienna': 'Earthiness, Stability, Reliability',
  'Saddle Brown': 'Groundedness, Simplicity, Warmth',
  'Chocolate': 'Security, Protection, Support',
  'Peru': 'Earthiness, Warmth, Comfort',
  'Burlywood': 'Stability, Reliability, Warmth',
  'Sandy Brown': 'Warmth, Friendliness, Earthiness',
  'Tan': 'Reliability, Stability, Earthiness',

  'White': 'Purity, Innocence, Clarity',
  'White Smoke': 'Clarity, Cleanliness, Simplicity',
  'Snow': 'Purity, Freshness, Clarity',
  'Honeydew': 'Freshness, Calmness, Soothing',
  'Mint Cream': 'Freshness, Clarity, Calmness',
  'Azure': 'Calmness, Clarity, Purity',
  'Alice Blue': 'Calmness, Serenity, Clarity',
  'Ghost White': 'Spirituality, Purity, Clarity',
  'Floral White': 'Purity, Innocence, Clarity',
  'Ivory': 'Purity, Elegance, Quiet',
  'Antique White': 'Softness, Vintage, Warmth',
  'Linen': 'Softness, Comfort, Simplicity',
  'Seashell': 'Softness, Warmth, Gentleness',
  'Beige': 'Calmness, Simplicity, Neutrality',
  'Old Lace': 'Softness, Elegance, Vintage',
  'Lemon Chiffon': 'Happiness, Cheerfulness, Freshness',
  'Cornsilk': 'Softness, Warmth, Comfort',
  'Blanched Almond': 'Softness, Warmth, Comfort',
  'Bisque': 'Softness, Warmth, Comfort',
  'Moccasin': 'Warmth, Comfort, Earthiness',
  'Navajo White': 'Earthiness, Warmth, Comfort',
  'Peach Puff': 'Warmth, Softness, Femininity',
  'Misty Rose': 'Tenderness, Romance, Femininity',

  'Gray': 'Balance, Neutrality, Sophistication',
  'Dim Gray': 'Seriousness, Conservatism, Formality',
  'Light Slate Gray': 'Reliability, Conservatism, Practicality',
  'Slate Gray': 'Solidity, Reliability, Practicality',
  'Dark Gray': 'Sophistication, Formality, Seriousness',
  'Silver': 'Sleekness, Modernity, Practicality',
  'Light Gray': 'Neutrality, Balance, Calmness',
  'Gainsboro': 'Neutrality, Simplicity, Practicality',

  'Black': 'Sophistication, Elegance, Mystery',
  'Dark Slate Gray': 'Formality, Sophistication, Seriousness',
  'Dim Gray': 'Conservatism, Formality, Reliability'
};

/**
 * Get the closest color name for a hex code
 * @param {string} hex - The hex code to find a name for
 * @returns {string} - The color name
 */
export const getColorName = (hex) => {
  if (!hex) return 'Unknown';

  // Normalize hex code
  hex = hex.toLowerCase();

  // Direct match
  if (colorNameMap[hex]) {
    return colorNameMap[hex];
  }

  // Find closest match
  let closestColor = 'Unknown';
  let closestDistance = Number.MAX_VALUE;

  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Find closest color by RGB distance
  Object.keys(colorNameMap).forEach(colorHex => {
    const cr = parseInt(colorHex.slice(1, 3), 16);
    const cg = parseInt(colorHex.slice(3, 5), 16);
    const cb = parseInt(colorHex.slice(5, 7), 16);

    // Calculate color distance using weighted Euclidean distance
    // Human eyes are more sensitive to green, then red, then blue
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) * 0.3 +
      Math.pow(g - cg, 2) * 0.59 +
      Math.pow(b - cb, 2) * 0.11
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestColor = colorNameMap[colorHex];
    }
  });

  // Determine color category based on RGB values
  // This helps avoid misclassification of colors
  const isRed = r > 200 && g < 100 && b < 100;
  const isGreen = g > 200 && r < 100 && b < 100;
  const isBlue = b > 200 && r < 100 && g < 100;
  const isYellow = r > 200 && g > 200 && b < 100;
  const isOrange = r > 200 && g > 100 && g < 200 && b < 100;
  const isPurple = r > 100 && g < 100 && b > 150;
  const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;

  // If we have a strong color signal but the closest match doesn't match the category,
  // override with a more appropriate color name
  if (isRed && !closestColor.includes('Red') && !closestColor.includes('Crimson') && !closestColor.includes('Tomato')) {
    return 'Red';
  } else if (isGreen && !closestColor.includes('Green')) {
    return 'Sea Green';
  } else if (isBlue && !closestColor.includes('Blue')) {
    return 'Royal Blue';
  } else if (isYellow && !closestColor.includes('Yellow') && !closestColor.includes('Gold')) {
    return 'Gold';
  } else if (isOrange && !closestColor.includes('Orange')) {
    return 'Orange';
  } else if (isPurple && !closestColor.includes('Purple') && !closestColor.includes('Violet')) {
    return 'Purple';
  } else if (isGray && !closestColor.includes('Gray') && !closestColor.includes('Silver')) {
    return 'Gray';
  }

  return closestColor;
};

/**
 * Get the emotional association for a color
 * @param {string} colorName - The name of the color
 * @returns {string} - The emotional association
 */
export const getColorEmotion = (colorName) => {
  return colorEmotions[colorName] || 'Unique, Distinctive';
};

/**
 * Get both the color name and emotional association for a hex code
 * @param {string} hex - The hex code
 * @returns {object} - Object with name and emotion properties
 */
export const getColorInfo = (hex) => {
  const name = getColorName(hex);
  const emotion = getColorEmotion(name);

  return {
    name,
    emotion,
    hex
  };
};

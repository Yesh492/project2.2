import React from "react";
import { getColorName, getColorEmotion } from "../utils/colorUtils";

export default function ColorPalette({ colors }) {
  if (!colors || colors.length === 0) return null;

  // Filter out any duplicate color names to avoid showing the same color multiple times
  const uniqueColors = [];
  const seenColorNames = new Set();

  for (const color of colors) {
    const colorName = getColorName(color.hex);
    if (!seenColorNames.has(colorName)) {
      seenColorNames.add(colorName);
      uniqueColors.push({
        ...color,
        name: colorName,
        emotion: getColorEmotion(colorName)
      });
    }
  }

  // Limit to 4 colors maximum
  const displayColors = uniqueColors.slice(0, 4);

  return (
    <div className="color-palette">
      {displayColors.map((color, i) => (
        <div
          key={i}
          className="color-box"
          style={{
            background: color.hex,
            color: isLightColor(color.hex) ? '#000' : '#fff'
          }}
        >
          <div className="color-name">{color.name}</div>
          <div className="color-emotion">{color.emotion}</div>
        </div>
      ))}
    </div>
  );
}

// Helper function to determine if text should be black or white based on background color
function isLightColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate perceived brightness using the formula: (R * 0.299 + G * 0.587 + B * 0.114)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

  // Return true if the color is light (brightness > 128)
  return brightness > 128;
}
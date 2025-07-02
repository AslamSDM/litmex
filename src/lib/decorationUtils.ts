"use client";

/**
 * A utility function to generate random positions for floating elements
 * This helps create a more dynamic and varied appearance for decorative elements
 */
export const getRandomPosition = () => {
  // Random positions within certain bounds
  const top = Math.floor(Math.random() * 80) + 10; // 10% to 90%
  const left = Math.floor(Math.random() * 80) + 10; // 10% to 90%

  // Random animation delays
  const delays = [100, 200, 300, 500, 700, 1000, 1500, 2000];
  const delay = delays[Math.floor(Math.random() * delays.length)];

  // Random size variation (subtle)
  const size = Math.floor(Math.random() * 4) + 4; // 4px to 8px

  return {
    position: {
      top: `${top}%`,
      left: `${left}%`,
    },
    animationDelay: `animation-delay-${delay}`,
    size: `w-${size} h-${size}`,
  };
};

/**
 * A utility to generate multiple random decorative elements
 * @param count Number of elements to generate
 * @param elementType The type of element to create (diamond, heart, etc.)
 * @returns Array of position objects
 */
export const generateRandomDecorations = (count = 5, elementType = "all") => {
  const decorations = [];
  const types = ["diamond", "spade", "club", "heart", "crown"];

  for (let i = 0; i < count; i++) {
    const position = getRandomPosition();
    const type =
      elementType === "all"
        ? types[Math.floor(Math.random() * types.length)]
        : elementType;

    decorations.push({
      ...position,
      type,
    });
  }

  return decorations;
};

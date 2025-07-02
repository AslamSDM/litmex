"use client";

import { useEffect, useState } from "react";

/**
 * Hook to ensure sections are properly centered in the viewport
 * Provides responsive positioning and additional helper CSS variables
 */
export default function useSectionCentering() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Function to set CSS variables for viewport centering
    const updateViewportVariables = () => {
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Update dimensions state
      setDimensions({
        width: viewportWidth,
        height: viewportHeight,
      });

      // Set CSS variables for positioning
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${viewportHeight}px`
      );
      document.documentElement.style.setProperty(
        "--viewport-width",
        `${viewportWidth}px`
      );
      document.documentElement.style.setProperty(
        "--viewport-center-y",
        `${viewportHeight / 2}px`
      );
      document.documentElement.style.setProperty(
        "--viewport-center-x",
        `${viewportWidth / 2}px`
      );

      // Calculate appropriate sizes based on viewport
      const idealContentWidth = Math.min(viewportWidth * 0.85, 1200);
      document.documentElement.style.setProperty(
        "--content-max-width",
        `${idealContentWidth}px`
      );

      // Set section-specific positioning variables
      document.documentElement.style.setProperty(
        "--section-center-transform",
        "translate(-50%, -50%)"
      );

      // Set max-widths for different section types
      document.documentElement.style.setProperty(
        "--section-center-max-width",
        `${Math.min(800, viewportWidth * 0.8)}px`
      );

      document.documentElement.style.setProperty(
        "--section-side-max-width",
        `${Math.min(600, viewportWidth * 0.7)}px`
      );

      // Set responsive spacing
      const horizontalSpacing = Math.max(24, viewportWidth * 0.05);
      document.documentElement.style.setProperty(
        "--horizontal-spacing",
        `${horizontalSpacing}px`
      );

      // Update dimensions state
      setDimensions({
        width: viewportWidth,
        height: viewportHeight,
      });

      console.log("Viewport variables updated:", {
        height: viewportHeight,
        width: viewportWidth,
        center: { x: viewportWidth / 2, y: viewportHeight / 2 },
        contentWidth: idealContentWidth,
        spacing: horizontalSpacing,
      });
    };

    // Set initially with a slight delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      updateViewportVariables();
    }, 100);

    // Debounced resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateViewportVariables();
      }, 100);
    };

    // Update on resize
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimensions; // Return dimensions in case parent components need them
}

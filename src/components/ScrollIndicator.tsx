"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  fadeAfter?: number; // Scroll percentage after which the indicator should fade out (0-1)
}

export const ScrollIndicator = ({ fadeAfter = 0.1 }: ScrollIndicatorProps) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Function to handle scroll and update opacity
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Calculate scroll percentage based on window height
      const scrollPercentage = Math.min(
        scrollY / (windowHeight * fadeAfter),
        1
      );

      // Opacity decreases as scroll percentage increases (inverse relationship)
      const newOpacity = Math.max(1 - scrollPercentage, 0);
      setOpacity(newOpacity);
    };

    // Add event listener
    window.addEventListener("scroll", handleScroll);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fadeAfter]);

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-none"
      animate={{ opacity }}
      initial={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-primary text-sm mb-2 tracking-wider font-semibold">
        SCROLL
      </div>
      <motion.div
        animate={{
          y: [0, 8, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ChevronDown className="text-primary h-6 w-6" />
      </motion.div>
    </motion.div>
  );
};

export default ScrollIndicator;

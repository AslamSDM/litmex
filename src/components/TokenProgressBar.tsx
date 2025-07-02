"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { DecorativeIcon } from "./DecorativeElements";

interface TokenProgressBarProps {
  raised: number;
  goal: number;
  className?: string;
}

export const TokenProgressBar: React.FC<TokenProgressBarProps> = ({
  raised,
  goal,
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, (raised / goal) * 100));

  return (
    <Suspense
      fallback={<div className="h-16 bg-gray-200 animate-pulse rounded-md" />}
    >
      <div className={`w-full ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <DecorativeIcon
              icon="diamond"
              size="xs"
              className="mr-2 text-primary"
            />
            <span className="text-sm font-medium">Progress</span>
          </div>
          <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
        </div>

        <div className="h-4 w-full bg-black/50 border border-primary/20 rounded-md overflow-hidden relative">
          {/* Progress gradient */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Shimmering effect */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="h-full w-3/4 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-fast" />
          </div>

          {/* Progress marks */}
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-white/20"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      </div>
    </Suspense>
  );
};

export default TokenProgressBar;

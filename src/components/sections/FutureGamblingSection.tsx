"use client";

import React from "react";
import { motion } from "framer-motion";

interface FutureGamblingSectionProps {
  isVisible: boolean;
}

export default function FutureGamblingSection({
  isVisible,
}: FutureGamblingSectionProps) {
  return (
    <motion.div
      className="sticky top-0 left-0 w-screen h-screen z-10 overflow-hidden"
      animate={{
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        duration: 0.5,
        ease: "easeInOut",
      }}
      style={{
        visibility: isVisible ? "visible" : "hidden",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {/* Title - huge at bottom left */}
      <motion.div
        className="title-text"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="angular-bg slide-in-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-display text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Future of Gamblifi
          </motion.h1>
        </motion.div>
      </motion.div>

      {/* Main description - center left */}
      <motion.div
        className="floating-text absolute left-[5%] bottom-[20%] md:bottom-[10%] max-w-[90%]  transform -translate-y-1/2 slide-in"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <p className="text-white/90 mb-3">
          Immutable smart contract betting meets DeFi. Litmex Protocol powers
          fair, transparent, and unstoppable betting through blockchain where
          code is law and the odds are on-chain.
        </p>
      </motion.div>
    </motion.div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface IntroSectionProps {
  isVisible: boolean;
  isIos?: boolean; // Optional prop for iOS detection
}

export default function IntroSection({
  isVisible,
  isIos = false,
}: IntroSectionProps) {
  return (
    <motion.div
      className="sticky top-0 left-0 w-screen h-screen z-50 overflow-hidden "
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
      {/* Title text - huge at bottom left */}
      <motion.div
        className="title-text "
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="angular-bg slide-in-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          style={{ zIndex: 2, position: "relative" }}
        >
          <motion.h1
            className="text-6xl md:text-8xl text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            LITMEX PROTOCOL
          </motion.h1>
        </motion.div>
      </motion.div>

      {/* Main description text - scattered on the left */}
      <motion.div
        className="floating-text absolute left-[5%] bottom-[10%] md:bottom-[10%] max-w-[90%]  transform -translate-y-1/2 slide-in"
        initial={{ opacity: 0, x: -30 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          x: isVisible ? 0 : -30,
        }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <p className="text-xl mt-2 text-white/90">
          Built on Solana, Litmex combines decentralized prediction markets,
          addictive mini games, and autonomous AI betting agents. It&apos;s not
          just gambling it&apos;s intelligent, automated crypto wagering at
          scale.
        </p>
      </motion.div>
      <Link href={isIos ? "/presale-ios" : "/presale"}>
        <motion.button
          className="absolute top-6 right-6 z-40 bg-black hover:bg-primary text-primary-foreground px-3 py-1 rounded-xl text-sm font-medium transition-colors duration-300 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : -10,

            // Bounce animation
          }}
          transition={{
            duration: 0.6,
            delay: 0.4,
            y: {
              repeat: Infinity,
              repeatType: "reverse",
              duration: 3,
              ease: "easeInOut",
            },
            opacity: { duration: 0.6, delay: 0.4 },
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative overflow-hidden">
            Presale Live <span className="ml-1">&gt;</span>
            {/* Shine effect */}
          </div>
        </motion.button>
      </Link>

      {/* Additional floating elements - scattered along the sides */}
    </motion.div>
  );
}

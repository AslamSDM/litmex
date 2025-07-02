"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import "../sections/animation-utils.css";

interface CtaSectionProps {
  isVisible: boolean;
}

export default function CtaSection({ isVisible }: CtaSectionProps) {
  return (
    <motion.div
      className="sticky top-0 left-0 w-screen h-screen overflow-hidden flex flex-col justify-between -z-1"
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
        willChange: "opacity",
      }}
    >
      {/* Title - huge at bottom left */}
      <motion.div
        className="title-text absolute bottom-20 left-12"
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
            Join Presale Now
          </motion.h1>
        </motion.div>
      </motion.div>
      {/* Main content - right side */}
      {/* <motion.div
        className="floating-text floating-animation-slow absolute right-12 top-1/2 transform -translate-y-1/2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <p className="text-xl text-white/90 max-w-lg text-right mb-8">
          Early investors gain exclusive benefits, reduced fees, and priority
          access to premium features.
        </p>
        <div className="flex justify-end">
          <Link href="/presale" className="inline-block">
            {/* <button className="bg-primary text-primary-foreground px-8 py-4 text-lg hover:scale-105 transition-all duration-300 ease-out rounded-md flex items-center">
              <span className="mr-2">Buy LITMEX Tokens</span>
              <ChevronRight className="w-5 h-5" />
            </button> 
          </Link>
        </div>
      </motion.div> */}
      {/* <VelocityScroll className="z-[-60] absolute top-[400px] ">
        <span className="text-5xl md:text-7xl font-display text-primary">
          Litmex
        </span>
      </VelocityScroll> */}

      <Link href="/presale">
        <button className=" absolute bottom-24 left-1/2 text-center justify-center transform -translate-x-1/2 text-center z-40 bg-primary hover:bg-primary/90 text-primary-foreground w-1/2 h-12 px-3 py-3 rounded-xl text-lg font-medium transition-colors duration-300 flex items-center mr-[300px]">
          Join Presale <span className="ml-1">&gt;</span>
        </button>
      </Link>
      {/* Additional floating elements - more spread out positions */}
      <motion.div
        className="floating-text floating-animation-fast absolute top-16 left-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.7 : 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <p className="text-lg text-primary/80">Early Access</p>
      </motion.div>
    </motion.div>
  );
}

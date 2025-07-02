// src/components/PresaleErrorBoundary.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import LuxuryCard from "./LuxuryCard";
import { DecorativeIcon } from "./DecorativeElements";

export default function PresaleErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <LuxuryCard className="p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-black/20 z-0" />

          <div className="relative z-10">
            <DecorativeIcon
              icon="diamond"
              size="md"
              className="mx-auto mb-4 text-red-400/70"
            />

            <h2 className="text-xl sm:text-2xl font-bold mb-3 luxury-text">
              Temporarily Unavailable
            </h2>

            <p className="mb-6 text-gray-300 text-sm sm:text-base">
              We&apos;re experiencing technical difficulties with our presale
              data. Our team has been notified and is working to resolve the
              issue.
            </p>

            <div className="flex items-center justify-center">
              <button
                onClick={reset}
                className="px-6 py-2 bg-gradient-to-r from-red-600/80 to-red-500/80 rounded-md 
                          hover:from-red-600 hover:to-red-500 transition-all duration-300
                          border border-red-500/30 shadow-lg shadow-red-500/10 text-white"
              >
                Try Again
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              Error reference: {error.digest || "Unknown"}
            </div>
          </div>

          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/40" />
        </LuxuryCard>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface GlowButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  type,
  onClick,
  className = "",
  disabled = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.button
      type={type || "button"}
      className={`
        relative inline-flex items-center justify-center px-6 py-3
        bg-primary/80 text-primary-foreground font-medium
        rounded-md overflow-hidden
        transition-all duration-300
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-primary"}
        ${className}
      `}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      disabled={disabled}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-glow/0 via-primary-glow/70 to-primary-glow/0"
        initial={{ x: "-100%" }}
        animate={{ x: isHovering ? "100%" : "-100%" }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: isHovering ? Infinity : 0,
        }}
      />

      {/* Subtle border */}
      <div className="absolute inset-0 rounded-md border border-primary-glow/20" />

      {/* Clipped corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-background" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-background" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.button>
  );
};

export default GlowButton;

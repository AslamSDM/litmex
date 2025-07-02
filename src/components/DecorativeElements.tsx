"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Diamond, Crown, Spade, Club, Heart } from "lucide-react";

interface DecorativeElementProps {
  className?: string;
  position?: "tl" | "tr" | "bl" | "br" | "left" | "right";
  text?: string;
  icon?: "diamond" | "crown" | "spade" | "club" | "heart";
  size?: "xs" | "sm" | "md" | "lg";
}

export function DecorativeCorner({
  position = "tl",
  className,
}: DecorativeElementProps) {
  return (
    <div
      className={cn(
        "corner-decoration",
        `corner-decoration-${position}`,
        className
      )}
    />
  );
}

export function DecorativeText({
  text = "Litmex",
  position = "left",
  className,
}: DecorativeElementProps) {
  return (
    <div
      className={cn(
        "decorative-text",
        `decorative-text-${position}`,
        className
      )}
    >
      {text}
    </div>
  );
}

export function DecorativeIcon({
  icon = "diamond",
  className,
  size = "md",
}: DecorativeElementProps & { size?: "xs" | "sm" | "md" | "lg" }) {
  const getSizeClass = () => {
    switch (size) {
      case "xs":
        return "w-3 h-3";
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-5 h-5";
      case "lg":
        return "w-6 h-6";
      default:
        return "w-4 h-4";
    }
  };

  const getIcon = () => {
    const sizeClass = getSizeClass();
    switch (icon) {
      case "diamond":
        return <Diamond className={sizeClass} />;
      case "crown":
        return <Crown className={sizeClass} />;
      case "spade":
        return <Spade className={sizeClass} />;
      case "club":
        return <Club className={sizeClass} />;
      case "heart":
        return <Heart className={sizeClass} />;
      default:
        return <Diamond className={sizeClass} />;
    }
  };

  return (
    <div className={cn("absolute text-primary/50 floating-element", className)}>
      {getIcon()}
    </div>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return <div className={cn("sparkle", className)} />;
}

"use client";

import React from "react";
import { Diamond, Crown, Spade, Club, Heart } from "lucide-react";
import { generateRandomDecorations } from "@/lib/decorationUtils";

interface BackgroundDecorationsProps {
  count?: number;
  type?: "diamond" | "spade" | "club" | "heart" | "crown" | "all";
  opacity?: number;
}

export default function BackgroundDecorations({
  count = 8,
  type = "all",
  opacity = 0.1,
}: BackgroundDecorationsProps) {
  const decorations = generateRandomDecorations(count, type);

  const renderIcon = (type: string) => {
    switch (type) {
      case "diamond":
        return <Diamond />;
      case "crown":
        return <Crown />;
      case "spade":
        return <Spade />;
      case "club":
        return <Club />;
      case "heart":
        return <Heart />;
      default:
        return <Diamond />;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
      {decorations.map((decoration, index) => (
        <div
          key={index}
          className={`absolute text-primary floating-element ${decoration.animationDelay}`}
          style={{
            top: decoration.position.top,
            left: decoration.position.left,
            opacity: opacity,
          }}
        >
          <div className={decoration.size}>{renderIcon(decoration.type)}</div>
        </div>
      ))}
    </div>
  );
}

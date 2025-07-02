"use client";

import React, { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DecorativeCorner,
  DecorativeText,
  DecorativeIcon,
} from "@/components/DecorativeElements";

interface LuxuryCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  footer?: React.ReactNode;
  icon?: "diamond" | "crown" | "spade" | "club" | "heart";
  iconPosition?: "tl" | "tr" | "bl" | "br";
  decorativeText?: string;
  animate?: boolean;
  noDecorativeIcon?: boolean;
}

export default function LuxuryCard({
  children,
  className,
  title,
  footer,
  icon = "diamond",
  iconPosition = "tr",
  decorativeText,
  animate = false,
  noDecorativeIcon = false,
}: LuxuryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty("--x", `${x}%`);
      card.style.setProperty("--y", `${y}%`);
    };

    card.addEventListener("mousemove", handleMouseMove);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const animationClass = animate ? "animate-float" : "";

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative overflow-hidden luxury-card transition-all duration-500",
        animationClass,
        className
      )}
    >
      <div className="luxury-shimmer"></div>
      <div className="cut-corner-border"></div>
      <DecorativeCorner position="br" />
      <div className="luxury-corner luxury-corner-tl"></div>
      <div className="luxury-corner luxury-corner-tr"></div>
      <div className="luxury-corner luxury-corner-bl"></div>
      <div className="luxury-corner luxury-corner-br"></div>

      {decorativeText && (
        <DecorativeText text={decorativeText} position="left" />
      )}

      {!noDecorativeIcon && (
        <DecorativeIcon
          icon={icon}
          size="md"
          className={cn(
            "transition-all duration-300 animate-pulse-slow",
            iconPosition === "tl" && "top-4 left-4",
            iconPosition === "tr" && "top-4 right-4",
            iconPosition === "bl" && "bottom-4 left-4",
            iconPosition === "br" && "bottom-4 right-4"
          )}
        />
      )}

      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent className="relative z-10">{children}</CardContent>

      {footer && <CardFooter className="relative z-10">{footer}</CardFooter>}
    </Card>
  );
}

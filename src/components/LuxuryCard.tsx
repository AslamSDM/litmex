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

  const animationClass = animate ? "" : "";

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] border border-[rgba(55,128,212,0.3)] bg-[rgba(13,13,15,0.6)] backdrop-blur-lg p-2 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4),0_0_25px_rgba(212,175,55,0.25)] hover:border-[rgba(212,175,55,0.6)] group",
        animationClass,
        className
      )}
    >
      <div className="absolute inset-[-10%] bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(212,175,55,0.15)_0%,transparent_50%)] z-0 pointer-events-none transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"></div>
      <div className="cut-corner-border"></div>

      <DecorativeCorner position="br" />

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
        <CardHeader className="mt-4">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent className="relative z-10 mt-4">{children}</CardContent>

      {footer && <CardFooter className="relative z-10">{footer}</CardFooter>}
    </Card>
  );
}

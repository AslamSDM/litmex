"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
}

export default function ScrollAnimationWrapper({
  children,
  className,
  threshold = 0.2,
  delay = 0,
}: ScrollAnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={cn("scroll-fade-in", isVisible ? "visible" : "", className)}
    >
      {children}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import {
  motion,
  useScroll,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
// import useReferralHandling from "@/components/hooks/useReferralHandling";
// import ReferralIndicator from "@/components/ReferralIndicator";

// Import section components
import IntroSection from "@/components/sections/IntroSection";
import FutureGamblingSection from "@/components/sections/FutureGamblingSection";
import BettingMarketsSection from "@/components/sections/BettingMarketsSection";
import StakeEarnSection from "@/components/sections/StakeEarnSection";
import SecuritySection from "@/components/sections/SecuritySection";
import CtaSection from "@/components/sections/CtaSection";
import { FakeHeader } from "@/components/FakeHeader";
import useReferralHandling from "@/components/hooks/useReferralHandling";

const TOTAL_SCROLL_ANIMATION_UNITS = 100;
const DynamicSpline = React.lazy(() => import("@splinetool/react-spline"));

// const MAX_SPLINE_SCROLL_VALUE = 1000;

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<number>(0);
  const [mappedScrollProgress, setMappedScrollProgress] = useState<number>(0);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const referralInfo = useReferralHandling();
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Check for mobile devices
      const isMobile =
        /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(
          navigator.userAgent
        );

      // Check specifically for iOS devices
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsIOS(isIOS);
      // Check for memory limitations (simple heuristic)

      console.log(
        `Device detected: ${isMobile ? "Mobile" : "Desktop"}, iOS: ${isIOS}, Memory limited: `
      );
    }
  }, []);

  // Device and capability detection
  // const [deviceInfo, setDeviceInfo] = useState({
  //   isIOS: false,
  //   isMobile: false,
  //   memoryLimited: false,
  // });
  //

  const { scrollY } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // const [useSplineFallback, setUseSplineFallback] = useState<boolean>(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setMappedScrollProgress(latest / 50);
  });

  // const navigateToSection = useCallback(
  //   (sectionIndex: number) => {
  //     try {
  //       const targetSection = Math.max(0, Math.min(sectionIndex, 5));
  //       let targetScrollPercentage: number;

  //       if (targetSection === 0) {
  //         targetScrollPercentage = 0;
  //       } else {
  //         const sectionThresholds = [
  //           TOTAL_SCROLL_ANIMATION_UNITS * (1 / 6),
  //           TOTAL_SCROLL_ANIMATION_UNITS * (2 / 6),
  //           TOTAL_SCROLL_ANIMATION_UNITS * (3 / 6),
  //           TOTAL_SCROLL_ANIMATION_UNITS * (4 / 6),
  //           TOTAL_SCROLL_ANIMATION_UNITS * (5 / 6),
  //         ];

  //         targetScrollPercentage =
  //           (sectionThresholds[targetSection - 1] + 1) /
  //           TOTAL_SCROLL_ANIMATION_UNITS;
  //       }

  //       const scrollHeight =
  //         document.documentElement.scrollHeight - window.innerHeight;
  //       const targetScrollPosition = scrollHeight * targetScrollPercentage;

  //       window.scrollTo({
  //         top: targetScrollPosition,
  //         behavior: "smooth",
  //       });
  //     } catch (error) {
  //       console.error("Error navigating to section:", error);
  //     }
  //   },
  //   [useSplineFallback]
  // );

  // Section change detection
  useEffect(() => {
    const sectionThresholds = [
      TOTAL_SCROLL_ANIMATION_UNITS * (1 / 6),
      TOTAL_SCROLL_ANIMATION_UNITS * (2 / 6),
      TOTAL_SCROLL_ANIMATION_UNITS * (3 / 6),
      TOTAL_SCROLL_ANIMATION_UNITS * (4 / 6),
      TOTAL_SCROLL_ANIMATION_UNITS * (5 / 6),
    ];

    let newSection;
    if (mappedScrollProgress < sectionThresholds[0]) {
      newSection = 0;
    } else if (mappedScrollProgress < sectionThresholds[1]) {
      newSection = 1;
    } else if (mappedScrollProgress < sectionThresholds[2]) {
      newSection = 2;
    } else if (mappedScrollProgress < sectionThresholds[3]) {
      newSection = 3;
    } else {
      newSection = 4;
    }

    if (newSection !== activeSection) {
      setActiveSection(newSection);
      // sectionChangeSound.play();
      console.log(
        `Section changed to: ${newSection}, at mapped progress: ${mappedScrollProgress.toFixed(
          2
        )}`
      );
    }
  }, [mappedScrollProgress, activeSection]);

  const sectionVisibility = [
    activeSection === 0,
    activeSection === 1,
    activeSection === 2,
    activeSection === 3,
    activeSection === 4,
    activeSection === 5,
  ];

  return (
    <div ref={containerRef} className="relative w-full">
      <FakeHeader />

      {/* Referral indicator */}
      {/* {referralInfo.isValid && referralInfo.code && (
        <ReferralIndicator
          referralCode={referralInfo.code}
          referrerUsername={referralInfo.referrerUsername}
        />
      )} */}

      {/* Main 3D scene container */}
      <div className="sticky top-0 left-0 w-full h-screen z-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        <Suspense fallback={<div className="w-full h-full bg-gray-100" />}>
          <DynamicSpline
            scene="https://prod.spline.design/ypLMYfb0s1KZPBHq/scene.splinecode"
            className="w-full h-full"
            // style={{
            //   // Optimize for mobile performance
            //   willChange: deviceInfo.isMobile ? "auto" : "transform",
            // }}
            // Reduce quality on memory-limited devices
            // renderOnDemand={deviceInfo.memoryLimited}
          />
        </Suspense>
      </div>

      {/* Sections container */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {sectionVisibility[0] && (
            <IntroSection isVisible={true} key="intro" />
          )}
          {sectionVisibility[1] && (
            <FutureGamblingSection isVisible={true} key="future" />
          )}
          {sectionVisibility[2] && (
            <BettingMarketsSection isVisible={true} key="markets" />
          )}
          {sectionVisibility[3] && (
            <StakeEarnSection isVisible={true} key="stake" />
          )}
          {/* {sectionVisibility[4] && (
            <SecuritySection isVisible={true} key="security" />
          )} */}
          {sectionVisibility[4] && <CtaSection isVisible={true} key="cta" />}
        </AnimatePresence>
      </div>

      {/* Scrollable height container */}
      <div style={{ height: "500vh" }} aria-hidden="true"></div>
    </div>
  );
}

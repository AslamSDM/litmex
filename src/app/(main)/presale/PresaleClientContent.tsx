"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Diamond,
  Trophy,
  Coins,
  Timer,
  ChevronRight,
  Lock as LockIcon,
  BarChart4,
} from "lucide-react";
import LuxuryCard from "@/components/LuxuryCard";
import { DecorativeIcon } from "@/components/DecorativeElements";
import ScrollAnimationWrapper from "@/components/ScrollAnimationWrapper";
import BackgroundDecorations from "@/components/BackgroundDecorations";
import TokenProgressBar from "@/components/TokenProgressBar";
import CountdownTimer from "@/components/CountdownTimer";
import PresaleStats from "@/components/PresaleStats";
import { ReferralCard } from "@/components/ReferralCard";
import PresaleBuyForm from "@/components/PresaleBuyForm";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import RoadmapTimeline from "@/components/RoadmapTimeline";

import useAudioPlayer from "@/components/hooks/useAudioPlayer";
import ScrollIndicator from "@/components/ScrollIndicator";
import { useSession } from "next-auth/react";

// Use the /next import for Spline with React.lazy
const DynamicSpline = React.lazy(() => import("@splinetool/react-spline"));

import usePresale from "@/components/hooks/usePresale";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { LMX_PRICE } from "@/lib/constants";
import { useRouter } from "next/navigation";
import useReferralHandling from "@/components/hooks/useReferralHandling";

// Tokenomics data
const tokenomicsData = [
  { name: "Community", percentage: 30, color: "bg-primary" },
  { name: "Seed/Presale", percentage: 25, color: "bg-purple-600" },
  { name: "Team", percentage: 5, color: "bg-amber-500" },
  { name: "Liquidity", percentage: 15, color: "bg-green-500" },
  { name: "Advisers", percentage: 5, color: "bg-rose-500" },
  { name: "Marketing", percentage: 10, color: "bg-blue-500" },
  { name: "Developments", percentage: 4, color: "bg-indigo-500" },
  { name: "Partnerships", percentage: 6, color: "bg-pink-500" },
];

// Presale phases
const presalePhases = [
  {
    name: "Seed round",
    price: "0.06 USD",
    bonus: "+30%",
    status: "Active",
    date: "June 1 - July 1",
  },
  {
    name: "Phase 2",
    price: "0.012 USD",
    bonus: "+15%",
    status: "Upcoming",
    date: "July 16 - July 31",
  },
  {
    name: "Phase 3",
    price: "0.012 USD",
    bonus: "+0%",
    status: "Upcoming",
    date: "Aug 16 - Aug 31",
  },
];

// FAQ Item Component
interface FaqItemProps {
  question: string;
  answer: string;
  delay?: number;
  isOpen: boolean;
  index: number;
  onToggle: (index: number) => void;
}

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  delay = 0,
  isOpen,
  index,
  onToggle,
}) => {
  return (
    <ScrollAnimationWrapper delay={delay}>
      <div className="rounded-lg overflow-hidden">
        <LuxuryCard className="p-0" noDecorativeIcon={true}>
          <button
            className="w-full flex items-center justify-between p-3 sm:p-4 md:p-6 text-left"
            onClick={() => onToggle(index)}
          >
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium pr-2">
              {question}
            </h3>
            <div
              className={`transform transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              } flex-shrink-0`}
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rotate-90" />
            </div>
          </button>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isOpen ? "auto" : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 md:p-6 pt-0 border-t border-primary/20">
              <p className="text-gray-300 text-xs sm:text-sm md:text-base">
                {answer}
              </p>
            </div>
          </motion.div>
        </LuxuryCard>
      </div>
    </ScrollAnimationWrapper>
  );
};

// FAQ accordion that ensures only one item can be open at a time
const FaqAccordion = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Toggle function that closes any open item and opens the clicked one
  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // FAQ data
  const faqItems = [
    {
      question: "What is Litmex?",
      answer:
        "Litmex is a premium web3 gambling platform that combines the excitement of gaming with blockchain technology. The platform offers provably fair games, exclusive rewards, and luxury experiences for its users.",
      delay: 100,
    },
    {
      question: "How can I participate in the presale?",
      answer:
        "To participate in the presale, connect your Solana wallet, enter the amount of SOL you wish to invest, and complete the transaction. The LMX tokens will be distributed to your wallet once the presale concludes.",
      delay: 200,
    },
    {
      question: "What are the benefits of buying during presale?",
      answer:
        "Seed Round investors receive tokens at a discounted price compared to the public launch. You&apos;ll also receive bonuses based on the current phase and will have early access to platform features and exclusive VIP benefits.",
      delay: 300,
    },
    {
      question: "When will LMX be listed on exchanges?",
      answer:
        "LMX will be listed on Solana decentralized exchanges within 2-3 weeks after the presale ends. Major centralized exchange listings will follow in the subsequent months as the platform grows.",
      delay: 400,
    },
    {
      question: "Is there a vesting period for presale tokens?",
      answer:
        "No, all presale tokens will be fully unlocked and transferable once the token is launched on Solana. Team tokens are subject to a 12-month vesting period with monthly unlocks to ensure long-term commitment.",
      delay: 500,
    },
    {
      question: "How will the raised funds be used?",
      answer:
        "30% for platform development, 25% for liquidity provision, 20% for marketing and partnerships, 15% for legal and compliance, and 10% for operations and security infrastructure.",
      delay: 600,
    },
    {
      question: "Why did you choose Solana blockchain?",
      answer:
        "We selected Solana for its ultra-fast transaction speeds (up to 65,000 TPS), negligible gas fees (less than $0.01 per transaction), and growing ecosystem, making it ideal for gaming applications. Solana&apos;s efficiency enables seamless in-game transactions and rewards distribution.",
      delay: 700,
    },
    {
      question: "How do I set up a Solana wallet?",
      answer:
        "We recommend using Phantom or Solflare wallets. Download the browser extension or mobile app, create a new wallet, securely store your recovery phrase offline, and fund your wallet with SOL from an exchange. Make sure to connect your wallet on our website before participating in the presale.",
      delay: 800,
    },
    {
      question: "What is the total supply of LMX tokens?",
      answer:
        "The total supply of Litmex (LMX) tokens is 1 billion (1,000,000,000). Unlike Ethereum-based tokens, Solana SPL tokens don&apos;t require a hardcap on purchases during presale, allowing unrestricted participation while maintaining our tokenomics distribution.",
      delay: 900,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {faqItems.map((item, index) => (
        <FaqItem
          key={index}
          question={item.question}
          answer={item.answer}
          delay={item.delay}
          isOpen={activeIndex === index}
          index={index}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};

interface PresaleClientContentProps {
  contributorCount: number;
  totalRaised: number;
  usdRaised: number;
  userBalance?: number; // User's balance in LMX tokens
  initialSession?: any; // Session information
  prices?: {
    bnb?: number;
    sol?: number;
  };
}

const PresaleClientContent: React.FC<PresaleClientContentProps> = ({
  contributorCount,
  totalRaised,
  usdRaised,
  userBalance = 0,
  initialSession,
  prices = { bnb: 600, sol: 150 }, // Default prices if not provided
}) => {
  // Ensure prices object has the required properties and correct types
  const formattedPrices = {
    bnb: prices?.bnb || 600,
    sol: prices?.sol || 150,
  };
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const referralInfo = useReferralHandling();
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isLowMemoryDevice, setIsLowMemoryDevice] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(userBalance);

  useEffect(() => {
    async function fetchBalance() {
      if (initialSession?.user?.id) {
        try {
          const response = await fetch("/api/user/balance");
          if (!response.ok) {
            throw new Error("Failed to fetch balance");
          }
          const data = await response.json();
          setBalance(data.balance || 0);
        } catch (error) {
          console.error("Error fetching user balance:", error);
        }
      }
    }

    fetchBalance();
  }, []);

  useEffect(() => {
    console.log("PresaleClientContent mounted", isIOS);
  }, [isIOS]);

  // Use useMemo for device detection calculations
  React.useMemo(() => {
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

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setIsReducedMotion(prefersReducedMotion);

      // For iOS devices, enable memory optimization mode
      if (isIOS) {
        setIsLowMemoryDevice(true);
      }

      console.log(
        `Device detected: ${isMobile ? "Mobile" : "Desktop"}, iOS: ${isIOS}, Memory optimization: ${isIOS ? "enabled" : "disabled"}`
      );
      setLoaded(true);
    }
  }, []); // Empty dependency array ensures it runs only once
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Use the presale hook for wallet connection and presale data
  const { connected, switchNetwork, presaleNetwork } = usePresale();

  // Create refs for each section to track scroll position
  const statsSectionRef = useRef<HTMLElement>(null);
  const detailsSectionRef = useRef<HTMLElement>(null);
  const tokenomicsSectionRef = useRef<HTMLElement>(null);
  const whyInvestSectionRef = useRef<HTMLElement>(null);
  const referralSectionRef = useRef<HTMLElement>(null);
  const roadmapSectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLElement>(null);

  if (isIOS || !loaded) {
    return (
      <div className="container mx-auto relative z-10 mt-24 sm:mt-16 md:mt-22">
        <motion.div
          initial={{ opacity: 0, y: isLowMemoryDevice ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: isLowMemoryDevice ? 0.3 : 0.6 }}
          className="mb-8 sm:mb-12 md:mb-16"
        >
          <motion.div
            className="overflow-hidden relative mb-3"
            style={{ maxWidth: "100%", margin: "0 auto" }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-center ">
              <span className="text-primary">LITMEX Token Seed Round</span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg md:text-xl text-center max-w-3xl mx-auto mt-4">
              Litmex seed round is now live Building Gamblifi for autonomous
              onchain AI gambling . Join early as we reshape betting
            </p>
          </motion.div>
        </motion.div>{" "}
        <div className="w-full">
          <PresaleBuyForm
            prices={formattedPrices}
            className="backdrop-blur-xl border-primary/20 shadow-[0_0_10px] sm:shadow-[0_0_15px] md:shadow-[0_0_20px] rgba(212,175,55,0.2)"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full px-2 sm:px-4 md:px-6 lg:px-16 xl:px-24 min-h-screen overflow-hidden"
    >
      {/* Loading overlay - similar to homepage */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 mt-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={
                isLowMemoryDevice
                  ? {}
                  : { scale: [0.9, 1, 0.9], opacity: [0.5, 1, 0.5] }
              }
              transition={
                isLowMemoryDevice ? {} : { repeat: Infinity, duration: 2 }
              }
              className="text-4xl text-primary font-display"
            >
              LITMEX
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Enhanced Global Background - Always Active */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20" />

        {/* Interactive Grid Pattern - Fixed positioning */}

        {/* Dot Pattern Overlay - Simplified for iOS */}
        {!isLowMemoryDevice ? (
          <div className="absolute inset-0">
            <DotPattern
              width={20}
              height={20}
              cx={1}
              cy={1}
              cr={1}
              className="opacity-20 fill-primary/10 [mask-image:linear-gradient(to_bottom_right,white,transparent,white)]"
            />
          </div>
        ) : (
          <></>
        )}

        {/* Animated floating orbs - conditionally rendered for non-iOS or high-memory devices */}
        {!isLowMemoryDevice ? (
          <>
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none"
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -80, 60, 0],
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 0.8, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              style={{ left: "10%", top: "20%" }}
            />

            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
              animate={{
                x: [0, -80, 60, 0],
                y: [0, 100, -40, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 0.8, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5,
              }}
              style={{ right: "15%", top: "40%" }}
            />

            <motion.div
              className="absolute w-[250px] h-[250px] rounded-full blur-[60px] pointer-events-none"
              animate={{
                x: [0, 60, -30, 0],
                y: [0, -60, 80, 0],
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.1, 0.9, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 10,
              }}
              style={{ left: "60%", bottom: "20%" }}
            />
          </>
        ) : (
          // Simple static gradient for iOS devices
          <div className="absolute w-full h-full opacity-20 bg-gradient-radial from-primary/10 to-transparent pointer-events-none"></div>
        )}

        {/* Animated connection lines - disabled for low memory devices */}
        {!isLowMemoryDevice && (
          <svg className="absolute inset-0 w-full h-full opacity-10 overflow-hidden">
            <motion.path
              d="M0,200 Q30%,100 60%,200 T100%,200"
              stroke="url(#gradient1)"
              strokeWidth="1"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
            />
            <motion.path
              d="M0,400 Q25%,300 50%,400 T100%,400"
              stroke="url(#gradient2)"
              strokeWidth="1"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "loop",
                delay: 2,
              }}
            />
          </svg>
        )}

        {/* Particle effects - Reduced or static for iOS/low memory devices */}
        {!isLowMemoryDevice ? (
          // Full particles for high-memory devices
          Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
            />
          ))
        ) : (
          <></>
        )}
      </div>
      {/* Spline 3D background - with lower opacity and responsive display - completely disabled for iOS and low memory devices */}
      <div className="fixed inset-0 w-full h-full z-[1] pointer-events-none opacity-20 sm:opacity-25 md:opacity-30 overflow-hidden">
        {!isLowMemoryDevice && !isIOS && (
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm sm:text-base">Loading 3D Scene...</p>
              </div>
            }
          >
            <DynamicSpline
              scene="https://prod.spline.design/PF2KyDFuGz-3ZjKz/scene.splinecode"
              className="w-full h-full absolute inset-0 z-0 object-cover"
            />
          </Suspense>
        )}
      </div>
      {/* Scroll indicator at bottom - improved responsiveness */}
      <div className="fixed bottom-2 sm:bottom-4 md:bottom-6 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none w-full max-w-[80px] sm:max-w-[100px] md:max-w-[120px]">
        <ScrollIndicator fadeAfter={0.2} />
      </div>
      {/* Main presale section - Direct focus on stats and buying */}
      <section
        ref={statsSectionRef}
        className="min-h-screen relative z-10 py-8 sm:py-12 md:py-16 lg:py-20 px-1 sm:px-3 md:px-4 overflow-hidden flex flex-col justify-center"
      >
        {/* Section-specific background enhancement */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              left: "50%",
              top: "30%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        <div className="container mx-auto relative z-10 mt-24 sm:mt-16 md:mt-22">
          <motion.div
            initial={{ opacity: 0, y: isLowMemoryDevice ? 0 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isLowMemoryDevice ? 0.3 : 0.6 }}
            className="mb-8 sm:mb-12 md:mb-16"
          >
            <motion.div
              className="overflow-hidden relative mb-3"
              style={{ maxWidth: "100%", margin: "0 auto" }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl text-center ">
                <span className="text-primary">LITMEX Token Seed Round</span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl text-center max-w-3xl mx-auto mt-4">
                Litmex seed round is now live Building Gamblifi for autonomous
                onchain AI gambling . Join early as we reshape betting
              </p>
            </motion.div>
          </motion.div>

          <div className="w-full max-w-[95%] sm:max-w-md md:max-w-2xl lg:max-w-3x l mx-auto mb-6 sm:mb-8 md:mb-12 px-0 sm:px-2">
            <CountdownTimer
              targetDate={new Date("2025-07-20T23:59:59")}
              className="mb-4 sm:mb-6 md:mb-8"
            />
            <TokenProgressBar raised={totalRaised} goal={10000} />
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
            {connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 text-center backdrop-blur-sm w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto"
              >
                <p className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                  {presaleNetwork === "solana" ? "Solana" : "BSC"} Wallet
                  Connected
                </p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm opacity-80">
                    Your LMX Balance:
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-primary">
                    {balance.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    LMX
                  </span>
                </div>
                <p className="text-xs sm:text-sm opacity-80">
                  You can now participate in the Seed Round
                </p>
              </motion.div>
            )}
          </div>

          <div className="mt-12">
            {!isLowMemoryDevice && (
              <PresaleStats
                contributors={contributorCount}
                raised={Number(totalRaised.toFixed(0))}
                usdRaised={Number(usdRaised.toFixed(0))}
                userBalance={balance}
                daysLeft={Math.ceil(
                  (new Date("2025-06-30T23:59:59").getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
                referralBonus="10%"
              />
            )}
            {/* Direct Buy Section */}{" "}
            <motion.div
              initial={{ opacity: 0, y: isLowMemoryDevice ? 10 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: isLowMemoryDevice ? 0.3 : 0.5 }}
              className="mt-6 lg:max-w-2xl mx-auto relative px-0"
            >
              <div className="w-full">
                <PresaleBuyForm
                  prices={formattedPrices}
                  className="backdrop-blur-xl border-primary/20 shadow-[0_0_10px] sm:shadow-[0_0_15px] md:shadow-[0_0_20px] rgba(212,175,55,0.2)"
                />
              </div>

              {/* Enhanced dot pattern for buy form */}
              {!isLowMemoryDevice && (
                <div className="absolute inset-0 -z-10">
                  <DotPattern
                    className={cn(
                      "opacity-20 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
                    )}
                    width={15}
                    height={15}
                    cx={1}
                    cy={1}
                    cr={0.5}
                  />
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: isLowMemoryDevice ? 5 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: isLowMemoryDevice ? 0.3 : 0.5,
                delay: isLowMemoryDevice ? 0.1 : 0.2,
              }}
              className="flex flex-col sm:flex-row justify-center items-stretch gap-4 sm:gap-6 mt-6 sm:mt-8 md:mt-10 flex-wrap"
            >
              <LuxuryCard
                className="w-full sm:min-w-[180px] md:min-w-[220px] transform hover:scale-[1.02] sm:hover:scale-[1.08] transition-all duration-300 p-3 sm:p-4"
                animate={true}
              >
                <div className="text-center p-1 sm:p-2">
                  <DecorativeIcon
                    icon="diamond"
                    size="sm"
                    className="mb-2 sm:mb-4 mx-auto animate-pulse-slow"
                  />
                  <h3 className="luxury-text font-medium mb-2 sm:mb-3 text-base sm:text-lg">
                    Current Price
                  </h3>
                  <motion.p
                    className="text-xl sm:text-2xl md:text-3xl font-bold luxury-text"
                    animate={{
                      textShadow: [
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                        "0px 0px 8px rgba(212, 175, 55, 0.7)",
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {LMX_PRICE}
                  </motion.p>
                </div>
              </LuxuryCard>

              <LuxuryCard
                className="w-full sm:min-w-[180px] md:min-w-[220px] transform hover:scale-[1.02] sm:hover:scale-[1.08] transition-all duration-300 p-3 sm:p-4"
                animate={true}
              >
                <div className="text-center p-1 sm:p-2">
                  <DecorativeIcon
                    icon="crown"
                    size="sm"
                    className="mb-2 sm:mb-4 mx-auto animate-pulse-slow"
                  />
                  <h3 className="luxury-text font-medium mb-2 sm:mb-3 text-base sm:text-lg">
                    Bonus
                  </h3>
                  <motion.p
                    className="text-xl sm:text-2xl md:text-3xl font-bold luxury-text"
                    animate={{
                      textShadow: [
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                        "0px 0px 8px rgba(212, 175, 55, 0.7)",
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  >
                    10% TRUMP
                  </motion.p>
                </div>
              </LuxuryCard>

              <LuxuryCard
                className="w-full sm:min-w-[180px] md:min-w-[220px] transform hover:scale-[1.02] sm:hover:scale-[1.08] transition-all duration-300 p-3 sm:p-4"
                animate={true}
              >
                <div className="text-center p-1 sm:p-2">
                  <DecorativeIcon
                    icon="spade"
                    size="sm"
                    className="mb-2 sm:mb-4 mx-auto animate-pulse-slow"
                  />
                  <h3 className="luxury-text font-medium mb-2 sm:mb-3 text-base sm:text-lg">
                    Supply
                  </h3>
                  <motion.p
                    className="text-xl sm:text-2xl md:text-3xl font-bold luxury-text"
                    animate={{
                      textShadow: [
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                        "0px 0px 8px rgba(212, 175, 55, 0.7)",
                        "0px 0px 2px rgba(55, 128, 212, 0.3)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    1 B
                  </motion.p>
                </div>
              </LuxuryCard>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Tokenomics section */}
      {!isLowMemoryDevice && (
        <section
          ref={tokenomicsSectionRef}
          className="py-8 sm:py-12 md:py-16 px-4 bg-gradient-to-b from-background/80 via-background/60 to-black/80 relative"
        >
          <div className="container mx-auto">
            <ScrollAnimationWrapper>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center font-display">
                <span className="text-primary">Token</span> Distribution
              </h2>
            </ScrollAnimationWrapper>

            <div className=" gap-8 md:gap-12 items-center w-full">
              <ScrollAnimationWrapper delay={300}>
                <LuxuryCard
                  className="p-4 sm:p-6 md:p-8 transform hover:scale-[1.02] transition-all duration-300"
                  icon="diamond"
                  iconPosition="tr"
                >
                  <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
                    <BarChart4 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary mr-2 sm:mr-3 md:mr-4" />
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                      Token Allocation
                    </h3>
                  </div>
                  <div className="space-y-4 md:space-y-6 w-full">
                    {tokenomicsData.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className="w-full"
                      >
                        <div className="flex justify-between mb-1 sm:mb-2 items-center w-full">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${item.color} mr-1 sm:mr-2 border border-white/10`}
                            ></div>
                            <span className="text-primary/90 font-medium text-xs sm:text-sm md:text-base">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-bold text-white text-xs sm:text-sm md:text-base">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-black/50 h-2 sm:h-2.5 md:h-3 rounded-full p-[1px]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${item.color} shadow-glow`}
                          ></motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </LuxuryCard>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-12 md:py-16 px-4  relative z-10">
        <ScrollAnimationWrapper delay={150}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center font-display">
            <span className="text-primary"> Backed </span> by Industry Leaders
          </h2>
          <div className="w-screen ">
            <div className="relative w-full">
              {/* First set of logos - will be animated */}
              <motion.div
                className="flex items-center gap-16 sm:gap-24 md:gap-32"
                animate={isLowMemoryDevice ? {} : { x: [0, "-100%"] }}
                transition={
                  isLowMemoryDevice
                    ? {}
                    : {
                        x: {
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 30,
                          ease: "linear",
                        },
                      }
                }
              >
                {" "}
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/a16zcrypto_Logo.svg"
                    alt="a16z Crypto"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/paradigm-logo-removebg-preview.png"
                    alt="Paradigm"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/animoca-removebg-preview.png"
                    alt="Animoca Brands"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/dragonfly-removebg-preview.png"
                    alt="Dragonfly Capital"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                {/* <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/cbventures-removebg-preview.png"
                    alt="CB Ventures"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain scale-150 filter brightness-0 invert"
                  />
                </div> */}
                {/* Duplicate logos for seamless loop */}
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/a16zcrypto_Logo.svg"
                    alt="a16z Crypto"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/paradigm-logo-removebg-preview.png"
                    alt="Paradigm"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/animoca-removebg-preview.png"
                    alt="Animoca Brands"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/a16zcrypto_Logo.svg"
                    alt="a16z Crypto"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                  />
                </div>
                {!isIOS && (
                  <>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/paradigm-logo-removebg-preview.png"
                        alt="Paradigm"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/animoca-removebg-preview.png"
                        alt="Animoca Brands"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/dragonfly-removebg-preview.png"
                        alt="Dragonfly Capital"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    {/* <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/cbventures-removebg-preview.png"
                    alt="CB Ventures"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain scale-150 filter brightness-0 invert"
                  />
                </div> */}
                    {/* Duplicate logos for seamless loop */}
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/a16zcrypto_Logo.svg"
                        alt="a16z Crypto"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/paradigm-logo-removebg-preview.png"
                        alt="Paradigm"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/animoca-removebg-preview.png"
                        alt="Animoca Brands"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/a16zcrypto_Logo.svg"
                        alt="a16z Crypto"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>

                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/paradigm-logo-removebg-preview.png"
                        alt="Paradigm"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/animoca-removebg-preview.png"
                        alt="Animoca Brands"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/dragonfly-removebg-preview.png"
                        alt="Dragonfly Capital"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    {/* <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                  <Image
                    src="/logos/cbventures-removebg-preview.png"
                    alt="CB Ventures"
                    width={160}
                    height={80}
                    className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain scale-150 filter brightness-0 invert"
                  />
                </div> */}
                    {/* Duplicate logos for seamless loop */}
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/a16zcrypto_Logo.svg"
                        alt="a16z Crypto"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/paradigm-logo-removebg-preview.png"
                        alt="Paradigm"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                    <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                      <Image
                        src="/logos/animoca-removebg-preview.png"
                        alt="Animoca Brands"
                        width={160}
                        height={80}
                        className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </ScrollAnimationWrapper>
      </section>

      {/* Why invest section */}
      {!isLowMemoryDevice && (
        <section
          ref={whyInvestSectionRef}
          className="py-8 sm:py-12 md:py-16 px-4  backdrop-blur-sm relative z-10"
        >
          <div className="container mx-auto">
            <ScrollAnimationWrapper>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center font-display">
                Why <span className="text-primary">Invest</span> in Litmex?
              </h2>
            </ScrollAnimationWrapper>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              <ScrollAnimationWrapper delay={100}>
                <LuxuryCard
                  className="p-4 md:p-6 lg:p-8 h-full transform transition-all hover:scale-105 hover:-translate-y-1 "
                  icon="diamond"
                  iconPosition="tr"
                  animate={true}
                >
                  <div className="text-center mb-4 md:mb-6">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-400/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <Trophy className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                    </motion.div>
                    <h3 className="text-lg md:text-xl font-bold luxury-text">
                      Premium Experiences
                    </h3>
                  </div>
                  <p className="text-gray-300 text-center text-sm md:text-base">
                    Access to exclusive games, luxury tournaments, and VIP
                    experiences available only to token holders.
                  </p>
                </LuxuryCard>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper delay={200}>
                <LuxuryCard
                  className="p-4 md:p-6 lg:p-8 h-full transform transition-all hover:scale-105 hover:-translate-y-1"
                  icon="crown"
                  iconPosition="tr"
                  animate={true}
                >
                  <div className="text-center mb-4 md:mb-6">
                    <motion.div
                      whileHover={{ rotate: -10, scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-400/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <LockIcon className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
                    </motion.div>
                    <h3 className="text-lg md:text-xl font-bold luxury-text">
                      Revenue Sharing
                    </h3>
                  </div>
                  <p className="text-gray-300 text-center text-sm md:text-base">
                    Token holders receive a portion of the platform&apos;s
                    revenue through staking rewards and exclusive bonuses.
                  </p>
                </LuxuryCard>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper delay={300}>
                <LuxuryCard
                  className="p-4 md:p-6 lg:p-8 h-full transform transition-all hover:scale-105 hover:-translate-y-1"
                  icon="spade"
                  iconPosition="tr"
                  animate={true}
                >
                  <div className="text-center mb-4 md:mb-6">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-[0_0_15px_rgba(212,175,55,0.3)] border border-primary/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      <Diamond className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                    </motion.div>
                    <h3 className="text-lg md:text-xl font-bold luxury-text">
                      Limited Supply
                    </h3>
                  </div>
                  <p className="text-gray-300 text-center text-sm md:text-base">
                    With a fixed supply and deflationary mechanics, LMX tokens
                    are designed to increase in value as the platform grows.
                  </p>
                </LuxuryCard>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>
      )}
      {/* Referral section */}
      <section
        ref={referralSectionRef}
        className="py-8 sm:py-12 md:py-20 relative overflow-hidden"
      >
        {/* Enhanced referral section background - simplified for iOS */}
        <div className="absolute inset-0 overflow-hidden">
          {!isLowMemoryDevice ? (
            // Full animated background for non-iOS
            <motion.div
              className="absolute w-full h-full opacity-50 sm:opacity-60 md:opacity-70 lg:opacity-100"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {/* Animated star-like dots - reduced count for performance */}
              {Array.from({ length: isIOS ? 5 : 20 }).map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: Math.random() * 3 + 1 + "px",
                    height: Math.random() * 3 + 1 + "px",
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.1, 0.8, 0.1],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                  }}
                />
              ))}

              {/* Animated connection lines */}
              <svg className="absolute inset-0 w-full h-full">
                <motion.path
                  d="M0,100 C150,200 350,0 500,100"
                  stroke="rgba(212, 175, 55, 0.1)"
                  strokeWidth="0.5"
                  fill="transparent"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <motion.path
                  d="M100,0 C200,150 300,50 400,200"
                  stroke="rgba(212, 175, 55, 0.1)"
                  strokeWidth="0.5"
                  fill="transparent"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.3 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 2,
                  }}
                />
              </svg>
            </motion.div>
          ) : (
            // Static simple background for iOS
            <div className="absolute w-full h-full bg-gradient-to-b from-amber-900/5 to-black/5"></div>
          )}
        </div>

        {/* <BackgroundDecorations /> */}
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <ScrollAnimationWrapper delay={0.2}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12  text-gold-400">
              <DecorativeIcon
                icon="spade"
                size="xs"
                className="inline-block mr-1 sm:mr-2 md:mr-3 text-purple-400 align-middle"
              />
              Spread the Word & Earn
            </h2>
            <div className="text-center mb-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <LuxuryCard className="p-6 md:p-8 overflow-hidden bg-gradient-to-br from-primary/10 to-black/80">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="text-left">
                      <div className="flex items-center gap-3 mb-6">
                        <Image
                          src="/logos/wlf.svg"
                          alt="World Liberty Finance"
                          width={400}
                          height={100}
                          className="object-contain filter brightness-0 invert"
                        />
                      </div>

                      <h4 className="text-lg text-amber-400 font-semibold mb-3 mt-4">
                        Backed by Approval. Built for Patriots. Powered by
                        Crypto.
                      </h4>

                      <p className="text-sm md:text-base text-gray-200 mb-4">
                        The World Liberty Finance Treasury (WLFT) is a
                        legitimately approved crypto initiative aligned with
                        core economic principles of the Trump administration.
                        WLFT stands at the forefront of pro sovereignty finance,
                        rewarding its holders and builders through a federally
                        inspired Treasury reward mechanism.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                          FINANCIAL FREEDOM
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-white border border-white/20">
                          BUILT FOR PATRIOTS
                        </span>
                      </div>
                    </div>
                  </div>
                </LuxuryCard>

                <div className="p-6 md:p-8 bg-gradient-to-br from-amber-500/10 to-black/80 relative overflow-hidden">
                  {/* Background image with overlay */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src="/logos/trumpimage.webp"
                      alt="President Trump"
                      fill
                      className="object-cover opacity-25"
                      priority
                    />
                    {/* <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-amber-900/20 to-black/20 z-1"></div> */}
                  </div>

                  {/* Content with relative positioning to appear above the background */}
                  <DecorativeIcon
                    icon="crown"
                    size="xs"
                    className="text-amber-400 mr-2 mb-4"
                  />
                  <div className="relative z-10 ">
                    <h3 className="text-lg sm:text-xl font-bold text-amber-400 mb-4 flex items-center">
                      Trump Token Referral Rewards
                    </h3>
                  </div>

                  <div className="flex items-center justify-center mb-6 mt-[150px]">
                    <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-amber-400/20 p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center w-64">
                      <span className="text-amber-400 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                        10%
                      </span>
                      <span className="text-sm sm:text-base md:text-lg text-amber-300/80">
                        REFERRAL BONUS
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    {/* <p className="text-sm sm:text-base text-gray-300 mb-3">
                      Direct referrers will receive{" "}
                      <span className="text-amber-400 font-medium">
                        10% Trump Tokens
                      </span>{" "}
                      in Solana immediately upon successful referral purchase.
                      World Liberty Finance Treasury rewards your patriotism.
                    </p> */}

                    <div className="flex items-center text-xs sm:text-sm bg-amber-500/10 p-3 rounded mb-3">
                      <span className="text-amber-300">
                        💰 Rewards immediately transferred to your Solana wallet
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                      <span className="text-gray-300">Referral Limit</span>
                      <span className="text-amber-400 font-medium">
                        Unlimited
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-base sm:text-lg bg-black/30 p-3 rounded-lg border border-primary/10">
                Share your unique referral link and earn Trump Tokens on every
                purchase.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper delay={0.4}>
            <div className="max-w-xl mx-auto">
              <ReferralCard />
            </div>
          </ScrollAnimationWrapper>
        </div>
      </section>
      {/* Roadmap Section */}
      {!isLowMemoryDevice && (
        <section
          ref={roadmapSectionRef}
          className="py-8 sm:py-12 md:py-20 relative overflow-hidden"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-12 text-center font-display">
            Project <span className="text-primary">Roadmap</span>
          </h2>

          <RoadmapTimeline />
        </section>
      )}

      {/* FAQ Section */}
      {!isIOS && (
        <section
          ref={faqSectionRef}
          className="py-8 sm:py-12 md:py-20 relative overflow-hidden"
        >
          <div className="container mx-auto max-w-[95%] sm:max-w-md md:max-w-2xl lg:max-w-4xl px-1 sm:px-2 relative z-10">
            <ScrollAnimationWrapper>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-12 text-center font-display">
                  Frequently <span className="text-primary">Asked</span>{" "}
                  Questions
                </h2>
              </motion.div>
            </ScrollAnimationWrapper>

            <FaqAccordion />
          </div>
        </section>
      )}
      {/* iOS notice */}
    </div>
  );
};

export default PresaleClientContent;

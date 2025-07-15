"use client";
import React, { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { User, Wallet, Shield, Clock, Award, AlertCircle } from "lucide-react";
import { useAppKitState, useAppKitAccount } from "@reown/appkit/react";
import { modal } from "@/components/providers/wallet-provider";
import { AppKitStateShape, getWalletType } from "@/components/hooks/usePresale";
import { Button } from "@/components/ui/button";
import { UserActivityHistory } from "@/components/UserActivityHistory";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReferralCard from "@/components/ReferralCard";
import ReferralBalanceDisplay from "@/components/ReferralBalanceDisplay";
import TrumpBalanceCard from "@/components/TrumpBalanceCard";
import { UnifiedWalletButton } from "@/components/UnifiedWalletButton";

interface Purchase {
  id: string;
  createdAt: string;
  lmxTokensAllocated: string;
  status: string;
  network: string;
  transactionSignature: string;
}

interface ReferredUserPurchase extends Purchase {
  userEmail?: string | null;
  userName?: string | null;
  referralEarnings?: number;
}

interface UserData {
  purchases: Purchase[];
  balance: number;
  purchaseCount: number;
  referrals: {
    count: number;
    totalBonus: number;
    purchases: ReferredUserPurchase[];
    paymentStats: ReferralPaymentStats;
    referralStats?: {
      totalBonus: string;
      totalPendingBonus: string;
      totalUsd: string;
      totalPendingUsd: string;
      referralCount: number;
      referralCode: string;
      solanaVerified: boolean;
      payments: {
        completed: number;
        pending: number;
      };
    };
    referredUsers?: Array<{
      id: string;
      email?: string | null;
      name?: string | null;
      createdAt: string;
    }>;
  };
}

interface ReferralPaymentStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidUsd: number;
  totalPendingUsd: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
}

interface ProfileClientContentProps {
  userData?: UserData;
  trupPrice?: number;
  initialSession?: Session | null;
}

interface ReferralLevelData {
  level: number;
  title: string;
  description: string;
  percentage: number;
  referralCount: number;
  totalEarnings: number;
  totalEarningsUsd: number;
  referrals: {
    id: string;
    email?: string | null;
    username?: string | null;
    createdAt: string;
    totalPurchases: number;
    totalPurchaseAmount: number;
    bonusEarned: number;
  }[];
}

interface ReferralBalanceData {
  userId: string;
  referralCode: string;
  totalEarnings: number;
  totalEarningsUsd: number;
  totalReferrals: number;
  levels: ReferralLevelData[];
  summary: {
    completedPayments: number;
    pendingPayments: number;
    totalPaidAmount: number;
    totalPendingAmount: number;
  };
}
const formatCurrency = (amount: number, decimals: number = 2) => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const ProfileClientContent: React.FC<ProfileClientContentProps> = ({
  userData = {
    purchases: [],
    balance: 0,
    purchaseCount: 0,
    referrals: {
      count: 0,
      totalBonus: 0,
      purchases: [],
      paymentStats: {
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        totalPaidUsd: 0,
        totalPendingUsd: 0,
        completedPaymentsCount: 0,
        pendingPaymentsCount: 0,
      },
    },
  },
  trupPrice = 8,
  initialSession,
}) => {
  const appKitState = useAppKitState() as AppKitStateShape;
  const appkitAccountData = useAppKitAccount();
  const { loading } = appKitState;
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isLowMemoryDevice, setIsLowMemoryDevice] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<ReferralBalanceData | null>(
    null
  );
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  useEffect(() => {
    const fetchReferralBalances = async () => {
      if (sessionStatus !== "authenticated" || !session?.user?.id) {
        setLoadingBalance(false);
        return;
      }

      try {
        setLoadingBalance(true);
        const response = await fetch("/api/referral/balances");

        if (!response.ok) {
          throw new Error("Failed to fetch referral balances");
        }

        const data = await response.json();
        setBalanceData(data);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchReferralBalances();
  }, [session, sessionStatus]);
  // Detect iOS devices and set memory optimization flags
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
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
        `Profile: Device detected - iOS: ${isIOS}, Memory optimization: ${isIOS ? "enabled" : "disabled"}`
      );
    }
  }, []);
  const [balance, setBalance] = useState<number>(userData.balance || 0);

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
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [sessionStatus, router]);
  // Get the tab from URL query parameter if available
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Only run in the browser, not during SSR
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (
        tab &&
        ["overview", "wallets", "activity", "referrals"].includes(tab)
      ) {
        return tab;
      }
    }
    return "overview";
  });

  // Consider a user authenticated either via wallet connection or session
  const connected = appkitAccountData?.isConnected ?? false;
  const isAuthenticated = sessionStatus === "authenticated" || connected;
  const walletAddress =
    appkitAccountData?.address ||
    session?.user?.walletAddress ||
    session?.user?.solanaAddress ||
    session?.user?.evmAddress;

  const currentWalletType = getWalletType(appKitState, {
    isConnected: connected,
    caipAddress: appkitAccountData?.caipAddress,
  });

  const handleConnect = () => {
    modal.open();
  };

  const handleDisconnect = () => {
    modal.disconnect();
  };
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Update URL without full page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url);
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isLowMemoryDevice ? 0.05 : 0.1,
        delayChildren: isLowMemoryDevice ? 0.1 : 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: isLowMemoryDevice ? 10 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: isLowMemoryDevice ? 0.3 : 0.5 },
    },
  };
  return (
    <div className="container mx-auto py-24 px-4 md:px-8 min-h-screen relative mt-24 overflow-hidden">
      {/* Optimized background for iOS devices */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {!isLowMemoryDevice ? (
          <>
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-50"></div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: isLowMemoryDevice ? 10 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLowMemoryDevice ? 0.3 : 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
          Your <span className="luxury-text">Profile</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-white/80">
          {isAuthenticated
            ? "Manage your profile, view activity, and explore features."
            : "Connect your wallet to access exclusive features and track your gaming history"}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Sidebar */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-1 space-y-8"
        >
          <Card className="p-6 border border-primary/30 bg-black/60 backdrop-blur-sm relative overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.1)] luxury-card min-h-[500px]">
            {!isLowMemoryDevice && <div className="luxury-shimmer"></div>}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
            <div className="luxury-corner luxury-corner-tl"></div>
            <div className="luxury-corner luxury-corner-br"></div>

            <div className="flex flex-col items-center space-y-4">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                whileHover={!isLowMemoryDevice ? { scale: 1.05 } : {}}
                transition={
                  !isLowMemoryDevice
                    ? { type: "spring", stiffness: 300, damping: 10 }
                    : {}
                }
              >
                <User size={40} className="text-primary" />
              </motion.div>

              <h2 className="text-xl font-bold mt-4 luxury-text">
                {session?.user?.name || "Guest User"}
              </h2>
              <p className="text-sm text-white/70">
                {session?.user?.email || "Not connected"}
              </p>

              <div className="w-full">
                {!isAuthenticated ? (
                  <div className="my-6">
                    <p className="text-muted-foreground text-sm mb-4 text-center">
                      Sign in to view your full profile
                    </p>
                    <Button
                      onClick={handleConnect}
                      className="w-full bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                      disabled={loading}
                    >
                      {loading ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 w-full mt-4">
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Wallet Type</span>
                      <span className="text-primary capitalize">
                        {currentWalletType || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Status</span>
                      <span className="text-green-400">
                        <UnifiedWalletButton />
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Transactions</span>
                      <motion.span
                        className="text-primary"
                        animate={
                          !isLowMemoryDevice
                            ? {
                                textShadow: [
                                  "0 0 0px rgba(212,175,55,0)",
                                  "0 0 5px rgba(212,175,55,0.5)",
                                  "0 0 0px rgba(212,175,55,0)",
                                ],
                              }
                            : {}
                        }
                        transition={
                          !isLowMemoryDevice
                            ? { duration: 2, repeat: Infinity }
                            : {}
                        }
                      >
                        {userData.purchaseCount}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Balance</span>
                      <motion.span
                        className="text-primary"
                        animate={
                          !isLowMemoryDevice
                            ? {
                                textShadow: [
                                  "0 0 0px rgba(212,175,55,0)",
                                  "0 0 5px rgba(212,175,55,0.5)",
                                  "0 0 0px rgba(212,175,55,0)",
                                ],
                              }
                            : {}
                        }
                        transition={
                          !isLowMemoryDevice
                            ? {
                                duration: 2,
                                repeat: Infinity,
                                delay: 0.5,
                              }
                            : {}
                        }
                      >
                        {balance.toFixed(2)}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">ReferralBonus</span>
                      <motion.span
                        className="text-primary"
                        animate={
                          !isLowMemoryDevice
                            ? {
                                textShadow: [
                                  "0 0 0px rgba(212,175,55,0)",
                                  "0 0 5px rgba(212,175,55,0.5)",
                                  "0 0 0px rgba(212,175,55,0)",
                                ],
                              }
                            : {}
                        }
                        transition={
                          !isLowMemoryDevice
                            ? {
                                duration: 2,
                                repeat: Infinity,
                                delay: 0.5,
                              }
                            : {}
                        }
                      >
                        {loadingBalance
                          ? ""
                          : formatCurrency(balanceData?.totalEarnings ?? 0) +
                            "LMX"}{" "}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Referrals</span>
                      <motion.span
                        className="text-primary"
                        animate={
                          !isLowMemoryDevice
                            ? {
                                textShadow: [
                                  "0 0 0px rgba(212,175,55,0)",
                                  "0 0 5px rgba(212,175,55,0.5)",
                                  "0 0 0px rgba(212,175,55,0)",
                                ],
                              }
                            : {}
                        }
                        transition={
                          !isLowMemoryDevice
                            ? {
                                duration: 2,
                                repeat: Infinity,
                                delay: 1,
                              }
                            : {}
                        }
                      >
                        {userData.referrals.count}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      {/* <span className="text-white/70">Referral Bonus</span> */}
                      {/* <motion.span
                        className="text-primary"
                        animate={{
                          textShadow: [
                            "0 0 0px rgba(212,175,55,0)",
                            "0 0 5px rgba(212,175,55,0.5)",
                            "0 0 0px rgba(212,175,55,0)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 1.5,
                        }}
                      >
                        {userData.referrals.totalBonus} LMX
                      </motion.span> */}
                    </div>
                    {connected && (
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="w-full mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        {"Disconnect Wallet"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Profile Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2"
        >
          <Card className="border border-primary/30 bg-black/60 backdrop-blur-sm overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.1)] luxury-card">
            {!isLowMemoryDevice && <div className="luxury-shimmer"></div>}
            <div className="border-b border-primary/20">
              <div className="flex overflow-x-auto">
                <motion.button
                  onClick={() => handleTabChange("overview")}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === "overview"
                      ? "border-b-2 border-primary text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                  whileHover={!isLowMemoryDevice ? { y: -2 } : {}}
                  whileTap={!isLowMemoryDevice ? { y: 0 } : {}}
                >
                  Overview
                </motion.button>
                <motion.button
                  onClick={() => handleTabChange("wallets")}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === "wallets"
                      ? "border-b-2 border-primary text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                  whileHover={!isLowMemoryDevice ? { y: -2 } : {}}
                  whileTap={!isLowMemoryDevice ? { y: 0 } : {}}
                >
                  Wallets
                </motion.button>
                <motion.button
                  onClick={() => handleTabChange("activity")}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === "activity"
                      ? "border-b-2 border-primary text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                  whileHover={!isLowMemoryDevice ? { y: -2 } : {}}
                  whileTap={!isLowMemoryDevice ? { y: 0 } : {}}
                >
                  Activity
                </motion.button>
                <motion.button
                  onClick={() => handleTabChange("referrals")}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === "referrals"
                      ? "border-b-2 border-primary text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                  whileHover={!isLowMemoryDevice ? { y: -2 } : {}}
                  whileTap={!isLowMemoryDevice ? { y: 0 } : {}}
                >
                  Referrals
                </motion.button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <motion.div
                    variants={itemVariants}
                    className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                  >
                    <div className="flex items-center mb-4">
                      <Shield className="h-6 w-6 text-primary mr-2" />
                      <h3 className="text-lg font-medium luxury-text">
                        Profile Status
                      </h3>
                    </div>

                    {isAuthenticated ? (
                      <div className="flex items-center text-primary">
                        <motion.div
                          animate={
                            !isLowMemoryDevice
                              ? {
                                  rotate: [0, 10, 0],
                                  scale: [1, 1.1, 1],
                                }
                              : {}
                          }
                          transition={
                            !isLowMemoryDevice
                              ? { duration: 2, repeat: Infinity }
                              : {}
                          }
                        >
                          <Award className="mr-2 h-5 w-5" />
                        </motion.div>
                        <span className="text-white/90">
                          Your profile is active with a connected{" "}
                          {currentWalletType} wallet.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-primary">
                        <motion.div
                          animate={
                            !isLowMemoryDevice ? { scale: [1, 1.1, 1] } : {}
                          }
                          transition={
                            !isLowMemoryDevice
                              ? { duration: 1.5, repeat: Infinity }
                              : {}
                          }
                        >
                          <AlertCircle className="mr-2 h-5 w-5" />
                        </motion.div>
                        <span className="text-white/90">
                          Connect your wallet to unlock all features.
                        </span>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                      <div className="flex items-center mb-4">
                        <Clock className="h-6 w-6 text-primary mr-2 animate-pulse-slow" />
                        <h3 className="text-lg font-medium luxury-text">
                          Recent Activity
                        </h3>
                      </div>

                      {true ? (
                        <div className="space-y-4">
                          {userData.purchases.length > 0 ? (
                            userData.purchases.slice(0, 3).map((purchase) => (
                              <div
                                key={purchase.id}
                                className="border-b border-primary/10 pb-2 last:border-0"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-medium">
                                    LMX Purchase
                                  </span>
                                  <span className="text-primary">
                                    {Number(
                                      purchase.lmxTokensAllocated
                                    ).toFixed(2)}{" "}
                                    LMX
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-white/60">
                                  <span>
                                    {new Date(
                                      purchase.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="capitalize">
                                    {purchase.network.toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-white/70">No transactions yet</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-white/70">
                          Sign in or connect wallet to view your activity.
                        </p>
                      )}
                    </div>

                    {/* <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                      <div className="flex items-center mb-4">
                        <Award className="h-6 w-6 text-primary mr-2 animate-pulse-slow" />
                        <h3 className="text-lg font-medium luxury-text">
                          LMX Balance
                        </h3>
                      </div> */}

                    {/* Add the UserBalanceDisplay component */}
                    {/* <UserBalanceDisplay balance={balance} />
                    </div> */}
                  </motion.div>

                  {/* Trump Balance Card */}
                  {isAuthenticated && (
                    <motion.div variants={itemVariants} className="mt-8">
                      <TrumpBalanceCard
                        referralStats={userData.referrals.referralStats}
                        paymentStats={userData.referrals.paymentStats}
                        referralCount={userData.referrals.count}
                        trumpPrice={trupPrice}
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === "wallets" && (
                <div className="space-y-6">
                  <motion.div
                    variants={itemVariants}
                    className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                  >
                    <div className="flex items-center mb-4">
                      <Wallet className="h-6 w-6 text-primary mr-2 animate-pulse-slow" />
                      <h3 className="text-lg font-medium luxury-text">
                        Connected Wallets
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {connected && walletAddress ? (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <motion.div
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mr-3 border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                              whileHover={
                                !isLowMemoryDevice
                                  ? { rotate: 10, scale: 1.1 }
                                  : {}
                              }
                              transition={
                                !isLowMemoryDevice
                                  ? {
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 10,
                                    }
                                  : {}
                              }
                            >
                              <span className="text-xs text-primary font-bold uppercase">
                                {currentWalletType?.substring(0, 3) || "N/A"}
                              </span>
                            </motion.div>
                            <div>
                              <p className="font-medium text-white capitalize">
                                {currentWalletType} Wallet
                              </p>
                              <p className="text-sm text-primary/80">
                                {`${walletAddress.slice(
                                  0,
                                  10
                                )}...${walletAddress.slice(-6)}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleDisconnect}
                            variant="outline"
                            size="sm"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            disabled={loading}
                          >
                            {loading ? "..." : "Disconnect"}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <motion.p
                            className="text-white/70 mb-5"
                            animate={
                              !isLowMemoryDevice
                                ? { opacity: [0.7, 1, 0.7] }
                                : {}
                            }
                            transition={
                              !isLowMemoryDevice
                                ? { duration: 2, repeat: Infinity }
                                : {}
                            }
                          >
                            No wallets connected
                          </motion.p>
                          <motion.div
                            whileHover={
                              !isLowMemoryDevice ? { scale: 1.05 } : {}
                            }
                            whileTap={!isLowMemoryDevice ? { scale: 0.98 } : {}}
                          >
                            <Button
                              onClick={handleConnect}
                              className="mx-auto bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                              disabled={loading}
                            >
                              {loading ? "Connecting..." : "Connect Wallet"}
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-6">
                  <motion.div
                    variants={itemVariants}
                    className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                  >
                    {isAuthenticated ? (
                      <UserActivityHistory purchases={userData.purchases} />
                    ) : (
                      <div className="text-center py-10">
                        <motion.p
                          className="text-white/70 mb-6"
                          animate={
                            !isLowMemoryDevice ? { opacity: [0.7, 1, 0.7] } : {}
                          }
                          transition={
                            !isLowMemoryDevice
                              ? { duration: 2, repeat: Infinity }
                              : {}
                          }
                        >
                          Sign in or connect your wallet to view transaction
                          history
                        </motion.p>
                        <motion.div
                          whileHover={!isLowMemoryDevice ? { scale: 1.05 } : {}}
                          whileTap={!isLowMemoryDevice ? { scale: 0.98 } : {}}
                        >
                          <Button
                            onClick={handleConnect}
                            className="mx-auto bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                            disabled={loading}
                          >
                            {loading ? "Connecting..." : "Connect Wallet"}
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

              {activeTab === "referrals" && (
                <motion.div
                  variants={itemVariants}
                  className="w-full bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                >
                  {isAuthenticated ? (
                    <>
                      {/* Note about Trump balance being shown in Overview */}
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                        <div className="flex items-center mb-2">
                          <Award className="h-5 w-5 text-primary mr-2" />
                          <h4 className="font-medium text-primary">
                            TRUMP Balance Summary
                          </h4>
                        </div>
                        <p className="text-sm text-gray-300">
                          Your detailed TRUMP balance and referral earnings are
                          now displayed in the Overview tab.
                        </p>
                      </div>

                      {/* Referral link generation */}
                      <ReferralCard
                        totalBonus={userData.referrals.totalBonus}
                        referralCount={userData.referrals.count}
                        paymentStats={userData.referrals.paymentStats}
                        serverRenderedStats={userData.referrals.referralStats}
                      />

                      {/* 5-Level Referral Balance Display */}
                      <div className="mt-6">
                        <ReferralBalanceDisplay
                          trumpPrice={8}
                          balanceData={balanceData}
                          loadingBalance={loadingBalance}
                        />
                      </div>

                      {/* Referrals Table with Emails and Joined Dates */}
                      <div className="mt-6">
                        <h4 className="text-primary font-medium mb-4">
                          All Referred Users
                          {userData.referrals.count > 0 && (
                            <span className="text-sm text-white/70 ml-2">
                              ({userData.referrals.count} total)
                            </span>
                          )}
                        </h4>
                        {userData.referrals.count > 0 ? (
                          <div className="overflow-auto max-h-96">
                            <table className="w-full min-w-full">
                              <thead className="bg-primary/10 border-b border-primary/20">
                                <tr>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">
                                    User
                                  </th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">
                                    Email
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Joined Date
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Status
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Total Earned
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-primary/10">
                                {userData.referrals.referredUsers ? (
                                  // If we have all referred users data, use that
                                  userData.referrals.referredUsers.map(
                                    (user) => {
                                      // Convert the createdAt string to a Date object
                                      const joinedDate = new Date(
                                        user.createdAt
                                      );
                                      // Format the date as a readable string
                                      const formattedDate =
                                        joinedDate.toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        });

                                      // Find all purchases by this user
                                      const userPurchases =
                                        userData.referrals.purchases.filter(
                                          (purchase) =>
                                            (purchase.userEmail &&
                                              user.email &&
                                              purchase.userEmail ===
                                                user.email) ||
                                            purchase.id === user.id
                                        );

                                      const hasMadePurchase =
                                        userPurchases.length > 0;

                                      // Calculate total TRUMP earnings from this user's purchases
                                      const totalEarnings =
                                        userPurchases.reduce(
                                          (sum, purchase) =>
                                            sum +
                                            (purchase.referralEarnings || 0),
                                          0
                                        );

                                      return (
                                        <tr
                                          key={user.id}
                                          className="hover:bg-primary/5 transition-colors"
                                        >
                                          <td className="py-3 px-4 text-sm text-white/90">
                                            {user.name || "User"}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-white/90">
                                            {user.email || "No email provided"}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-right text-white/90">
                                            {formattedDate}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-right">
                                            {hasMadePurchase ? (
                                              <span className="text-green-400 font-medium">
                                                Purchased
                                              </span>
                                            ) : (
                                              <span className="text-amber-400">
                                                No purchase yet
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 px-4 text-sm text-right text-green-400 font-medium">
                                            {totalEarnings > 0
                                              ? `${totalEarnings.toFixed(2)} $TRUMP`
                                              : "-"}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  )
                                ) : (
                                  <></>
                                )}

                                {/* For users who haven't made any purchases yet but are referred */}
                                {/* Only show this message if we don't have referredUsers but we know there are more users than purchases */}
                                {!userData.referrals.referredUsers &&
                                  userData.referrals.count >
                                    userData.referrals.purchases.length && (
                                    <tr className="hover:bg-primary/5 transition-colors bg-amber-900/10">
                                      <td
                                        colSpan={5}
                                        className="py-3 px-4 text-sm text-center text-amber-400"
                                      >
                                        <span className="flex items-center justify-center gap-2">
                                          <AlertCircle className="h-4 w-4" />
                                          {userData.referrals.count -
                                            userData.referrals.purchases
                                              .length}{" "}
                                          more referred users not yet fetched
                                          from server
                                        </span>
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 text-center bg-black/20 rounded-lg">
                            <p className="text-white/70">
                              You haven't referred any users yet.
                            </p>
                          </div>
                        )}
                      </div>

                      {connected && currentWalletType === "solana" ? (
                        <div className="bg-black/20 p-6 rounded-lg mt-8"></div>
                      ) : connected ? (
                        <div className="bg-black/20 p-6 rounded-lg mt-8"></div>
                      ) : null}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <motion.p
                        className="text-white/70 mb-6"
                        animate={
                          !isLowMemoryDevice ? { opacity: [0.7, 1, 0.7] } : {}
                        }
                        transition={
                          !isLowMemoryDevice
                            ? { duration: 2, repeat: Infinity }
                            : {}
                        }
                      >
                        Sign in or connect your wallet to access the referral
                        program
                      </motion.p>
                      <motion.div
                        whileHover={!isLowMemoryDevice ? { scale: 1.05 } : {}}
                        whileTap={!isLowMemoryDevice ? { scale: 0.98 } : {}}
                      >
                        <Button
                          onClick={handleConnect}
                          className="mx-auto bg-primary hover:bg-primary/90 text-black font-semibold shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                          disabled={loading}
                        >
                          {loading ? "Connecting..." : "Connect Wallet"}
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileClientContent;

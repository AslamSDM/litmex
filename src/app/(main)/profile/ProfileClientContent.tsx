"use client";
import React, { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  User,
  Wallet,
  Shield,
  Clock,
  Award,
  AlertCircle,
  Share2,
} from "lucide-react";
import { useAppKitState, useAppKitAccount } from "@reown/appkit/react";
import { modal } from "@/components/providers/wallet-provider";
import { AppKitStateShape, getWalletType } from "@/components/hooks/usePresale";
import { Button } from "@/components/ui/button";
import { UserActivityHistory } from "@/components/UserActivityHistory";
import { UserBalanceDisplay } from "@/components/UserBalanceDisplay";
import { RecentActivitySummary } from "@/components/RecentActivitySummary";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReferralCard from "@/components/ReferralCard";
import TrumpBalanceCard from "@/components/TrumpBalanceCard";

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
  console.log(session);
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
  console.log(userData.referrals.purchases);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="container mx-auto py-24 px-4 md:px-8 min-h-screen relative mt-24 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            <div className="luxury-shimmer"></div>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>
            <div className="luxury-corner luxury-corner-tl"></div>
            <div className="luxury-corner luxury-corner-br"></div>

            <div className="flex flex-col items-center space-y-4">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
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
                      <span className="text-green-400">Connected</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Transactions</span>
                      <motion.span
                        className="text-primary"
                        animate={{
                          textShadow: [
                            "0 0 0px rgba(212,175,55,0)",
                            "0 0 5px rgba(212,175,55,0.5)",
                            "0 0 0px rgba(212,175,55,0)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {userData.purchaseCount}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Balance</span>
                      <motion.span
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
                          delay: 0.5,
                        }}
                      >
                        {userData.balance.toFixed(2)}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-primary/20">
                      <span className="text-white/70">Referrals</span>
                      <motion.span
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
                          delay: 1,
                        }}
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
                    <Button
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      disabled={loading}
                    >
                      {loading ? "Disconnecting..." : "Disconnect Wallet"}
                    </Button>
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
            <div className="luxury-shimmer"></div>
            <div className="border-b border-primary/20">
              <div className="flex overflow-x-auto">
                <motion.button
                  onClick={() => handleTabChange("overview")}
                  className={`px-6 py-4 font-medium text-sm transition-all duration-300 ${
                    activeTab === "overview"
                      ? "border-b-2 border-primary text-primary"
                      : "text-white/60 hover:text-white"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
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
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
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
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
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
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
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
                          animate={{
                            rotate: [0, 10, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
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
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
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

                    <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(212,175,55,0.05)] transform transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                      <div className="flex items-center mb-4">
                        <Award className="h-6 w-6 text-primary mr-2 animate-pulse-slow" />
                        <h3 className="text-lg font-medium luxury-text">
                          LMX Balance
                        </h3>
                      </div>

                      {/* Add the UserBalanceDisplay component */}
                      <UserBalanceDisplay balance={userData.balance} />
                    </div>
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
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 10,
                              }}
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
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            No wallets connected
                          </motion.p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
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
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Sign in or connect your wallet to view transaction
                          history
                        </motion.p>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
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
                      {userData.referrals.purchases.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-primary font-medium mb-4">
                            Referred Users Purchases
                          </h4>
                          <div className="overflow-auto max-h-96">
                            <table className="w-full min-w-full">
                              <thead className="bg-primary/10 border-b border-primary/20">
                                <tr>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-primary">
                                    User
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Amount
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Network
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Date
                                  </th>
                                  <th className="text-right py-3 px-4 text-sm font-medium text-primary">
                                    Earnings
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {userData.referrals.purchases.map(
                                  (purchase, index) => (
                                    <>
                                      <tr
                                        key={purchase.id}
                                        className={`border-b border-primary/10 hover:bg-primary/5 transition-colors ${index % 2 === 0 ? "bg-black/20" : "bg-black/10"}`}
                                      >
                                        <td className="py-3 px-4 text-sm text-white/90">
                                          {purchase.userName ||
                                            (purchase.userEmail
                                              ? `${purchase.userEmail.substring(0, 3)}...${purchase.userEmail.substring(purchase.userEmail.indexOf("@"))}`
                                              : "Anonymous User")}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-primary">
                                          {Number(
                                            purchase.lmxTokensAllocated
                                          ).toFixed(2)}{" "}
                                          LMX
                                        </td>

                                        <td className="py-3 px-4 text-sm text-right text-white/70 capitalize">
                                          {purchase.network.toLowerCase()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-white/70">
                                          {new Date(
                                            purchase.createdAt
                                          ).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-green-400">
                                          {purchase.referralEarnings
                                            ? `${purchase.referralEarnings.toFixed(2)} $TRUMP`
                                            : "N/A"}
                                        </td>
                                      </tr>
                                    </>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                          {userData.referrals.purchases.length > 5 && (
                            <div className="mt-3 text-center">
                              <span className="text-sm text-primary/80">
                                Showing {userData.referrals.purchases.length}{" "}
                                referred purchases
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Only show wallet signing section for Solana wallets since that's what the backend supports */}
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
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Sign in or connect your wallet to access the referral
                        program
                      </motion.p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
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

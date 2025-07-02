"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Users, Award, Star, TrendingUp } from "lucide-react";

interface ReferralStats {
  totalBonus: string;
  totalPendingBonus: string;
  totalUsd: string;
  totalPendingUsd: string;
  referralCount: number;
  referralCode?: string;
  solanaVerified?: boolean;
  payments?: {
    completed: number;
    pending: number;
  };
}

interface PaymentStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidUsd: number;
  totalPendingUsd: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
}

interface TrumpBalanceCardProps {
  trumpPrice?: number; // Default price of TRUMP token
  referralStats?: ReferralStats;
  paymentStats?: PaymentStats;
  referralCount: number;
  className?: string;
}

const TrumpBalanceCard: React.FC<TrumpBalanceCardProps> = ({
  trumpPrice = 8,
  referralStats,
  paymentStats,
  referralCount,
  className = "",
}) => {
  return (
    <div
      className={`  p-6 rounded-lg border-2 border-primary/40 shadow-[0_0_15px_rgba(212,175,55,0.15)] transform transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] relative ${className} overflow-hidden`}
    >
      {/* Trump image as background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.35, 0.3], // Increased opacity
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full relative"
        >
          <Image
            src="/logos/trumpimage.webp"
            alt="Trump Token Background"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
            className="opacity-30" // Explicit opacity on the image itself
          />
        </motion.div>
      </div>

      {/* Semi-transparent overlay to ensure text readability */}
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-black/60 to-black/70"></div>

      {/* Decorative elements for visual emphasis */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <Star className="h-5 w-5 text-primary/60" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center">
          <div>
            <h3 className="text-xl font-bold luxury-text">TRUMP Balance</h3>
            <p className="text-xs text-primary/70">Earned from referrals</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-primary/30  rounded-full text-sm font-medium text-primary border border-primary/30">
          10% Referral Bonus
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 relative z-10">
        <div className="rounded-lg p-4 border border-primary/30 relative overflow-hidden group hover:border-primary/50 transition-all duration-300 bg-black/40 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300"></div>
          <h4 className="text-sm text-gray-300 mb-1 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-green-400" />
            Earned TRUMP
          </h4>
          <div className="flex items-center">
            <motion.div
              className="text-2xl font-bold luxury-text"
              animate={{
                textShadow: [
                  "0 0 0px rgba(212,175,55,0)",
                  "0 0 8px rgba(212,175,55,0.7)",
                  "0 0 0px rgba(212,175,55,0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {referralStats
                ? parseFloat(referralStats.totalBonus).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })
                : "0"}{" "}
              <span className="text-primary">TRUMP</span>
            </motion.div>
          </div>
          <p className="text-xs text-primary/70 mt-1">
            Value: $
            {referralStats
              ? (
                  parseFloat(referralStats.totalBonus) * trumpPrice
                ).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
        </div>

        {parseFloat(referralStats?.totalPendingBonus ?? "0") > 0 && (
          <div className="rounded-lg p-4 border border-primary/30 relative overflow-hidden group hover:border-yellow-400/50 transition-all duration-300 bg-black/40 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-all duration-300"></div>
            <h4 className="text-sm text-yellow-300 mb-1 flex items-center">
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mr-1"
              >
                <Star className="h-3 w-3 text-yellow-300" />
              </motion.div>
              Pending TRUMP
            </h4>
            <div className="flex items-center">
              <motion.div
                className="text-2xl font-bold text-yellow-300"
                animate={{
                  textShadow: [
                    "0 0 0px rgba(234,179,8,0)",
                    "0 0 8px rgba(234,179,8,0.7)",
                    "0 0 0px rgba(234,179,8,0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {referralStats
                  ? (
                      parseFloat(referralStats.totalPendingBonus) * trumpPrice
                    ).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : "0"}{" "}
                <span className="text-yellow-200">TRUMP</span>
              </motion.div>
            </div>
            <p className="text-xs text-yellow-300/70 mt-1">
              Value: $
              {referralStats
                ? parseFloat(referralStats.totalPendingUsd).toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )
                : "0.00"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-primary/20 pt-4 relative z-10">
        <h4 className="text-sm font-medium mb-2 luxury-text">
          Your Referral Performance
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/60 backdrop-blur-sm p-2 rounded hover:bg-black/70 transition-all duration-300 border border-transparent hover:border-primary/20">
            <div className="text-xs text-gray-400">Referrals</div>
            <div className="text-lg font-semibold text-primary">
              {referralCount}
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-sm p-2 rounded hover:bg-black/70 transition-all duration-300 border border-transparent hover:border-primary/20">
            <div className="text-xs text-gray-400">Completed</div>
            <div className="text-lg font-semibold text-green-400">
              {paymentStats?.completedPaymentsCount ||
                referralStats?.payments?.completed ||
                0}
            </div>
          </div>
          <div className="bg-black/60 backdrop-blur-sm p-2 rounded hover:bg-black/70 transition-all duration-300 border border-transparent hover:border-primary/20">
            <div className="text-xs text-gray-400">Pending</div>
            <div className="text-lg font-semibold text-yellow-300">
              {paymentStats?.pendingPaymentsCount ||
                referralStats?.payments?.pending ||
                0}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Earnings Breakdown */}
      <motion.div
        className="mt-4 border-t border-primary/20 pt-4 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center mb-3">
          <Award className="w-4 h-4 text-primary mr-2" />
          <h4 className="text-sm font-medium luxury-text">
            Referral Earnings Breakdown
          </h4>
        </div>

        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-primary/10 hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Per Referral:</span>
            <span className="text-primary font-medium">
              10% in TRUMP tokens
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-gray-400">Average Earning:</span>
            <span className="text-primary font-medium">
              {referralCount > 0 && referralStats
                ? (
                    parseFloat(referralStats.totalBonus) / referralCount
                  ).toLocaleString("en-US", { maximumFractionDigits: 2 })
                : "0"}{" "}
              TRUMP
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-gray-400">Total Earned:</span>
            <span className="text-primary font-medium">
              {referralStats
                ? parseFloat(referralStats.totalBonus).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })
                : "0"}{" "}
              TRUMP ($
              {referralStats
                ? parseFloat(referralStats.totalUsd).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })
                : "0"}
              )
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrumpBalanceCard;

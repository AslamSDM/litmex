import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LuxuryCard from "./LuxuryCard";
import {
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

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

const ReferralBalanceDisplay = ({
  trumpPrice = 8,
  balanceData,
  loadingBalance = false,
}: {
  trumpPrice?: number;
  balanceData?: ReferralBalanceData | null;
  loadingBalance?: boolean;
}) => {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(
    new Set([1])
  );

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loadingBalance) {
    return (
      <LuxuryCard className="p-6 bg-gradient-to-br from-blue-500/10 to-black/80 border border-blue-500/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-blue-400">
            Loading referral balances...
          </span>
        </div>
      </LuxuryCard>
    );
  }

  if (status !== "authenticated") {
    return (
      <LuxuryCard className="p-6 bg-gradient-to-br from-blue-500/10 to-black/80 border border-blue-500/20">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white/70">
            Sign in to view your referral balances
          </p>
        </div>
      </LuxuryCard>
    );
  }

  if (error) {
    return (
      <LuxuryCard className="p-6 bg-gradient-to-br from-red-500/10 to-black/80 border border-red-500/20">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Error loading referral data</p>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </LuxuryCard>
    );
  }

  if (!balanceData) {
    return (
      <LuxuryCard className="p-6 bg-gradient-to-br from-blue-500/10 to-black/80 border border-blue-500/20">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-white/70">No referral data available</p>
        </div>
      </LuxuryCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <LuxuryCard className="p-6 bg-gradient-to-br from-blue-500/10 to-black/80 border border-blue-500/20">
        <h3 className="text-xl md:text-2xl font-bold text-blue-400 mb-6 text-center">
          5-Level Referral Balance
        </h3>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-black/40 p-4 rounded-lg text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(balanceData.totalEarnings)} LMX
            </p>
            <p className="text-sm text-gray-300">Total Earnings</p>
          </div>
        </div>
      </LuxuryCard>

      {/* Level Details */}
      <LuxuryCard className="p-6 bg-gradient-to-br from-blue-500/10 to-black/80 border border-blue-500/20">
        <h4 className="text-lg font-bold text-blue-400 mb-4">
          Referral Levels Breakdown
        </h4>

        <div className="space-y-4">
          {balanceData.levels.map((level) => (
            <div
              key={level.level}
              className="border border-blue-500/20 rounded-lg overflow-hidden"
            >
              {/* Level Header */}
              <div
                className="bg-black/40 p-3 md:p-4 cursor-pointer hover:bg-black/60 transition-colors"
                onClick={() => toggleLevel(level.level)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-white text-sm md:text-base truncate">
                        {level.title}
                      </h5>
                      <p className="text-xs md:text-sm text-gray-300 truncate">
                        {level.description}
                      </p>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="flex md:hidden items-center gap-2">
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-xs">
                        {level.percentage}%
                      </p>
                      <p className="text-green-400 font-bold text-xs">
                        {formatCurrency(level.totalEarnings, 0)} LMX
                      </p>
                    </div>
                    {expandedLevels.has(level.level) ? (
                      <ChevronDown className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-blue-400 font-bold">
                        {level.percentage}%
                      </p>
                      <p className="text-sm text-gray-300">Commission</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        {level.referralCount}
                      </p>
                      <p className="text-sm text-gray-300">Referrals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">
                        {formatCurrency(level.totalEarnings)} LMX
                      </p>
                      <p className="text-sm text-gray-300">
                        ${formatCurrency(level.totalEarningsUsd)}
                      </p>
                    </div>

                    {expandedLevels.has(level.level) ? (
                      <ChevronDown className="h-5 w-5 text-blue-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Level Details (Expanded) */}
              {expandedLevels.has(level.level) &&
                level.referrals.length > 0 && (
                  <div className="bg-black/20 p-2 md:p-4">
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3">
                      {level.referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="bg-black/40 p-3 rounded-lg border border-white/10"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium text-sm truncate">
                                  {referral.username || "Anonymous"}
                                </p>
                                <p className="text-gray-400 text-xs truncate">
                                  {referral.email
                                    ? referral.email.length > 25
                                      ? `${referral.email.substring(0, 10)}...${referral.email.substring(referral.email.indexOf("@"))}`
                                      : referral.email
                                    : "No email"}
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-green-400 font-bold text-sm">
                                  {formatCurrency(referral.bonusEarned)} LMX
                                </p>
                                <p className="text-gray-400 text-xs">
                                  Your Bonus
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                              <div className="text-center">
                                <p className="text-white text-xs font-medium">
                                  {formatDate(referral.createdAt)}
                                </p>
                                <p className="text-gray-400 text-xs">Joined</p>
                              </div>
                              <div className="text-center">
                                <p className="text-white text-xs font-medium">
                                  {referral.totalPurchases}
                                </p>
                                <p className="text-gray-400 text-xs">Purchases</p>
                              </div>
                              <div className="text-center">
                                <p className="text-white text-xs font-medium">
                                  ${formatCurrency(referral.totalPurchaseAmount)}
                                </p>
                                <p className="text-gray-400 text-xs">Amount</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs uppercase bg-black/40 text-white/60">
                          <tr>
                            <th className="px-3 py-2 text-left">User</th>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-right">Joined</th>
                            <th className="px-3 py-2 text-right">Purchases</th>
                            <th className="px-3 py-2 text-right">
                              Purchase Amount
                            </th>
                            <th className="px-3 py-2 text-right">Your Bonus</th>
                          </tr>
                        </thead>
                        <tbody className="text-white/80">
                          {level.referrals.map((referral) => (
                            <tr
                              key={referral.id}
                              className="border-t border-white/10"
                            >
                              <td className="px-3 py-2">
                                {referral.username || "Anonymous"}
                              </td>
                              <td className="px-3 py-2">
                                {referral.email
                                  ? referral.email.length > 20
                                    ? `${referral.email.substring(0, 8)}...${referral.email.substring(referral.email.indexOf("@"))}`
                                    : referral.email
                                  : "No email"}
                              </td>
                              <td className="px-3 py-2 text-right text-xs">
                                {formatDate(referral.createdAt)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {referral.totalPurchases}
                              </td>
                              <td className="px-3 py-2 text-right">
                                ${formatCurrency(referral.totalPurchaseAmount)}
                              </td>
                              <td className="px-3 py-2 text-right text-green-400 font-medium">
                                {formatCurrency(referral.bonusEarned)} LMX
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Empty State for Level */}
              {expandedLevels.has(level.level) &&
                level.referrals.length === 0 && (
                  <div className="bg-black/20 p-6 text-center">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      No referrals at this level yet
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-black/40 border border-blue-500/20 rounded-lg text-center">
          <p className="text-sm text-gray-300">
            Earn{" "}
            <span className="text-blue-400 font-bold">15% in LMX tokens</span>{" "}
            on all purchases made through your 5-level referral network!
          </p>
        </div>
      </LuxuryCard>
    </div>
  );
};

export default ReferralBalanceDisplay;

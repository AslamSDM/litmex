import React, { useState } from "react";
import { useSession } from "next-auth/react";
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
      <div className="p-4 bg-black/40 border border-blue-500/20 rounded-lg">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-blue-400 text-sm">
            Loading referral balances...
          </span>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-4 bg-black/40 border border-blue-500/20 rounded-lg text-center">
        <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
        <p className="text-white/70 text-sm">
          Sign in to view your referral balances
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-black/40 border border-red-500/20 rounded-lg text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-1 text-sm">Error loading referral data</p>
        <p className="text-white/70 text-xs">{error}</p>
      </div>
    );
  }

  if (!balanceData) {
    return (
      <div className="p-4 bg-black/40 border border-blue-500/20 rounded-lg text-center">
        <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
        <p className="text-white/70 text-sm">No referral data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary - Compact Mobile Header */}
      <div className="p-4 bg-black/40 border border-blue-500/20 rounded-lg">
        <h3 className="text-lg font-bold text-blue-400 mb-3 text-center">
          5-Level Referral Balance
        </h3>
        <div className="text-center bg-black/40 p-3 rounded">
          <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-400">
            {formatCurrency(balanceData.totalEarnings)} LMX
          </p>
          <p className="text-xs text-gray-300">Total Earnings</p>
        </div>
      </div>

      {/* Level Details - No Extra Wrapper */}
      <div className="space-y-3">
        <h4 className="text-base font-bold text-blue-400 px-2">
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
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-sm">
                        {level.percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">
                        {level.referralCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">
                        {formatCurrency(level.totalEarnings, 0)} LMX
                      </p>
                    </div>

                    {expandedLevels.has(level.level) ? (
                      <ChevronDown className="h-4 w-4 text-blue-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Level Details (Expanded) */}
              {expandedLevels.has(level.level) &&
                level.referrals.length > 0 && (
                  <div className="bg-black/20 p-2 md:p-4">
                    {/* Mobile Simple List */}
                    <div className="block md:hidden">
                      {level.referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="p-3 border-b border-white/10 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm font-medium truncate">
                                {referral.username ||
                                  referral.email?.split("@")[0] ||
                                  "User"}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {formatDate(referral.createdAt)} •{" "}
                                {referral.totalPurchases} purchases
                              </p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-green-400 font-bold text-sm">
                                +{formatCurrency(referral.bonusEarned)} LMX
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead className="text-xs uppercase bg-black/40 text-white/60">
                          <tr>
                            <th className="px-2 py-2 text-left">User</th>
                            <th className="px-2 py-2 text-right">Joined</th>
                            <th className="px-2 py-2 text-right">Purchases</th>
                            <th className="px-2 py-2 text-right">Your Bonus</th>
                          </tr>
                        </thead>
                        <tbody className="text-white/80">
                          {level.referrals.map((referral) => (
                            <tr
                              key={referral.id}
                              className="border-t border-white/10"
                            >
                              <td className="px-2 py-2 max-w-[140px]">
                                <div className="truncate">
                                  <p className="font-medium text-sm truncate">
                                    {referral.username ||
                                      referral.email?.split("@")[0] ||
                                      "User"}
                                  </p>
                                  {referral.email && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {referral.email.length > 25
                                        ? `${referral.email.substring(0, 10)}...@${referral.email.split("@")[1]}`
                                        : referral.email}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right text-xs text-gray-300">
                                {formatDate(referral.createdAt)}
                              </td>
                              <td className="px-2 py-2 text-right text-sm">
                                {referral.totalPurchases}
                              </td>
                              <td className="px-2 py-2 text-right text-green-400 font-medium text-sm">
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

        {/* Footer Info - Compact */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
          <p className="text-xs text-gray-300">
            Earn{" "}
            <span className="text-blue-400 font-bold">15% in LMX tokens</span>{" "}
            on all purchases!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralBalanceDisplay;

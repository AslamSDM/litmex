"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";
import { useSession } from "next-auth/react";

type ReferralStats = {
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

interface ReferralStatsProps {
  serverRenderedStats?: ReferralStats;
}

export default function ReferralStats({
  serverRenderedStats,
}: ReferralStatsProps) {
  const { connected, publicKey } = useWallet();
  const { address } = useAccount();
  const [stats, setStats] = useState<ReferralStats | null>(
    serverRenderedStats || null
  );
  const [loading, setLoading] = useState<boolean>(!serverRenderedStats);
  const { data: session } = useSession();

  // Fetch referral stats using session data only if we don't have server-rendered stats
  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!session?.user) return;

      // Skip fetching if we already have server-rendered stats
      if (serverRenderedStats) {
        setStats(serverRenderedStats);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`/api/referral/bonuses`);

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalBonus: data.totalBonus,
            totalPendingBonus: data.totalPendingBonus || "0",
            totalUsd: data.totalUsd || "0",
            totalPendingUsd: data.totalPendingUsd || "0",
            referralCount: data.referralCount,
            referralCode: data.referralCode,
            solanaVerified: data.solanaVerified || false,
            payments: data.payments || { completed: 0, pending: 0 },
          });
        }
      } catch (err) {
        console.error("Error fetching referral stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, [session, serverRenderedStats]);

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      alert("Referral code copied to clipboard!");
    }
  };

  if (!stats && loading) {
    return (
      <div className="animate-pulse bg-black/30 backdrop-blur-md rounded-lg p-4">
        <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-gray-700/50 rounded"></div>
          <div className="h-16 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session?.user || !stats) {
    return null;
  }

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 sm:p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs sm:text-sm font-medium">Your Referral Stats</h3>
      </div>

      <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="bg-black/20 rounded p-2">
          <div className="text-xs text-gray-400">Referrals</div>
          <div className="text-base sm:text-lg font-semibold">
            {stats.referralCount}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-xs text-gray-400">Total Value</div>
          <div className="text-base sm:text-lg font-semibold">
            $
            {parseFloat(stats.totalUsd).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">Earned TRUMP</div>
        <div className="text-xs sm:text-sm font-medium">
          {parseFloat(stats.totalBonus).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}{" "}
          TRUMP
        </div>
      </div>

      {parseFloat(stats.totalPendingBonus) > 0 && (
        <div className="mt-2 sm:mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
            <div className="text-xs sm:text-sm text-yellow-300 font-medium">
              Pending Rewards
            </div>
            {!stats.solanaVerified && (
              <div className="text-xs bg-yellow-500/20 text-yellow-300 px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                Verify Wallet
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm break-words">
            <span className="font-semibold">
              {parseFloat(stats.totalPendingBonus).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            TRUMP ($
            {parseFloat(stats.totalPendingUsd).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
            )
          </div>
          {!stats.solanaVerified && (
            <div className="text-[10px] sm:text-xs text-yellow-300/70 mt-1">
              Verify your Solana wallet to claim your pending rewards
            </div>
          )}
        </div>
      )}

      {/* Display referral payment stats if available */}
      {stats.payments &&
        (stats.payments.completed > 0 || stats.payments.pending > 0) && (
          <div className="mt-2 sm:mt-3 bg-primary/10 border border-primary/30 rounded-lg p-2 sm:p-3">
            <div className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">
              Referral Payments
            </div>

            {stats.payments.completed > 0 && (
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs text-gray-400">
                  Completed
                </span>
                <span className="text-[10px] sm:text-xs font-medium">
                  {stats.payments.completed}
                </span>
              </div>
            )}

            {stats.payments.pending > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-xs text-gray-400">
                  Pending
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-yellow-300">
                  {stats.payments.pending}
                </span>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Copy, Check, LogIn, Coins, Users, Wallet } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAppKitAccount } from "@reown/appkit/react";
import { generateReferralUrl } from "@/lib/referral";
import { Button } from "@/components/ui/button";

interface UserData {
  balance: number;
  referrals: {
    count: number;
    totalBonus: number;
    paymentStats: {
      totalPaidAmount: number;
      totalPendingAmount: number;
    };
    referralStats?: {
      referralCode: string;
      totalBonus: string;
      totalPendingBonus: string;
    };
  };
}

interface ProfileIOSClientProps {
  initialUserData: UserData;
}

export default function ProfileIOSClient({
  initialUserData,
}: ProfileIOSClientProps) {
  const { data: session, status } = useSession();
  const { isConnected } = useAppKitAccount();
  const [copied, setCopied] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");

  // Use server-rendered data instead of fetching it again
  const [userData] = useState<UserData>(initialUserData);
  const [isLoading, setIsLoading] = useState(false);

  // Generate referral URL when component mounts or referral code changes
  useEffect(() => {
    // Get referral code from server data or session
    const code =
      userData.referrals.referralStats?.referralCode ||
      (session?.user as any)?.referralCode ||
      "";

    if (code) {
      const url = generateReferralUrl(code);
      setReferralUrl(url);
    }
  }, [session, userData.referrals.referralStats]);

  // Handle copying referral link
  const copyReferralLink = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If still loading session (should be very quick since data is pre-fetched)
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-indigo-950/30 px-4">
        <p className="text-white/70">Loading session...</p>
      </div>
    );
  }

  // We have the server-rendered data, so session check is lightweight
  const isAuthenticated = status === "authenticated" || isConnected;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950/30 px-4 py-24 flex flex-col">
      <div className="mt-12 mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <p className="text-white/70 text-sm mt-1">Balance & Referrals</p>
      </div>

      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-white/70 mb-6 text-center">
            Sign in to view your profile, balance and referral info
          </p>
          <Button
            onClick={() => signIn()}
            className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary flex items-center gap-2"
          >
            <LogIn size={16} />
            Sign In
          </Button>
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5 mb-5 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">LMX Balance</p>
              <p className="text-2xl font-bold text-white">
                {userData.balance.toLocaleString()} LMX
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Referral Stats Card */}
          <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/70 text-sm">Referral Stats</p>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/20 p-3 rounded-md">
                <p className="text-xs text-white/60 mb-1">Total Referrals</p>
                <p className="text-lg font-semibold text-white">
                  {userData.referrals.count}
                </p>
              </div>
              <div className="bg-black/20 p-3 rounded-md">
                <p className="text-xs text-white/60 mb-1">Total Earnings</p>
                <p className="text-lg font-semibold text-primary">
                  {userData.referrals.totalBonus.toFixed(2)} LMX
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-3 rounded-md">
                <p className="text-xs text-white/60 mb-1">Paid Rewards</p>
                <p className="text-lg font-semibold text-green-400">
                  {userData.referrals.paymentStats.totalPaidAmount.toFixed(2)}{" "}
                  LMX
                </p>
              </div>
              <div className="bg-black/20 p-3 rounded-md">
                <p className="text-xs text-white/60 mb-1">Pending</p>
                <p className="text-lg font-semibold text-amber-400">
                  {userData.referrals.paymentStats.totalPendingAmount.toFixed(
                    2
                  )}{" "}
                  LMX
                </p>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/70 text-sm">Your Referral Link</p>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="bg-black/50 p-3 rounded-md flex items-center justify-between mb-3 overflow-hidden">
              <p className="text-white text-sm truncate mr-2">
                {referralUrl || "Loading..."}
              </p>
              <Button
                onClick={copyReferralLink}
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10 px-2 min-w-[40px]"
                disabled={!referralUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-white/50 text-center">
              Share this link to earn rewards when others make purchases
            </p>
          </div>
        </>
      )}
    </div>
  );
}

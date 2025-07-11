"use client";

import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Copy, Check, LogIn, Coins, Users, Wallet, LogOut } from "lucide-react";
import { signIn } from "next-auth/react";
import { useAppKitAccount } from "@reown/appkit/react";
import { generateReferralUrl } from "@/lib/referral";
import { Button } from "@/components/ui/button";
import useReferralHandling from "@/components/hooks/useReferralHandling";

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
    referredUsers?: Array<{
      id: string;
      email?: string | null;
      name?: string | null;
      createdAt: string;
    }>;
    referralPurchases: {
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      lmxTokensAllocated?: string;
      network?: string;
      pricePerLmxInUsdt?: string;
      referralEarnings?: number;
      transactionSignature?: string;
      userEmail?: string;
      userId?: string;
      userName?: string;
    }[];
  };
  purchases: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    lmxTokensAllocated?: string;
    network?: string;
    pricePerLmxInUsdt?: string;
    referralEarnings?: number;
    transactionSignature?: string;
    userEmail?: string;
    userId?: string;
    userName?: string;
  }[];
}

interface ProfileIOSClientProps {
  initialUserData: UserData;
  trumpPrice?: number; // Optional prop for TRUMP price
}

export default function ProfileIOSClient({
  initialUserData,
  trumpPrice = 8, // Default price if not provided
}: ProfileIOSClientProps) {
  const { data: session, status } = useSession();
  const { isConnected } = useAppKitAccount();
  const [copied, setCopied] = useState(false);
  const refer = useReferralHandling();

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
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url(/bg_2.webp)" }}
      ></div>
      <div className="relative z-10">
        <header className="flex justify-between items-center shadow-sm mt-4 px-4">
          <div className="flex items-center">
            <img src="/lit_logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto text-red-400 hover:bg-red-500/10"
            onClick={() => {
              // Add your logout logic here
              signOut({ callbackUrl: "/" }); // Redirect to home after logout
            }}
          >
            <LogOut size={16} />
          </Button>
        </header>
        <div className="px-4 py-12 flex flex-col">
          <div className=" mb-8 text-center">
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
                    <p className="text-xs text-white/60 mb-1">
                      Total Referrals
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {userData.referrals.count}
                    </p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-md">
                    <p className="text-xs text-white/60 mb-1">Total Earnings</p>
                    <p className="text-lg font-semibold text-primary">
                      ${userData.referrals.totalBonus.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {(userData.referrals.totalBonus / trumpPrice).toFixed(2)}{" "}
                      TRUMP
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
          {/* Referred Users */}
          {userData.referrals.referredUsers &&
            userData.referrals.referredUsers.length > 0 && (
              <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/70 text-sm">Referred Users</p>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white/80">
                    <thead className="text-xs uppercase bg-black/40 text-white/60">
                      <tr>
                        <th className="px-3 py-2 text-left">User</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-right">Joined Date</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.referrals.referredUsers.map((user) => {
                        // Convert the createdAt string to a Date object
                        const joinedDate = new Date(user.createdAt);
                        // Format the date as a readable string
                        const formattedDate = joinedDate.toLocaleDateString();

                        // Check if this user has made a purchase
                        const hasPurchase =
                          userData.referrals.referralPurchases?.some(
                            (purchase) =>
                              purchase.userEmail === user.email ||
                              purchase.userId === user.id
                          );

                        return (
                          <tr
                            key={user.id}
                            className="border-t border-white/10"
                          >
                            <td className="px-3 py-2">
                              {user.name || "Anonymous"}
                            </td>
                            <td className="px-3 py-2">
                              {user.email
                                ? user.email.length > 15
                                  ? `${user.email.substring(0, 6)}...${user.email.substring(user.email.indexOf("@"))}`
                                  : user.email
                                : "No email"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formattedDate}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {hasPurchase ? (
                                <span className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-400">
                                  Purchased
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">
                                  No Purchase
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          {/* Recent Purchases */}
          {userData.purchases && userData.purchases.length > 0 && (
            <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5 mt-5">
              <h3 className="text-white font-medium mb-3">Your Purchases</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white/80">
                  <thead className="text-xs uppercase bg-black/40 text-white/60">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.purchases.map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="border-t border-white/10"
                      >
                        <td className="px-3 py-2">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {parseFloat(
                            purchase.lmxTokensAllocated ?? "0"
                          ).toLocaleString()}{" "}
                          LMX{" "}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              purchase.status === "completed"
                                ? "bg-green-900/30 text-green-400"
                                : purchase.status === "pending"
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-gray-900/30 text-gray-400"
                            }`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Referral Purchases */}
          {userData.referrals.referralPurchases &&
            userData.referrals.referralPurchases.length > 0 && (
              <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg p-5 mt-5 mb-12">
                <h3 className="text-white font-medium mb-3">
                  Referral Purchases
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white/80">
                    <thead className="text-xs uppercase bg-black/40 text-white/60">
                      <tr>
                        <th className="px-3 py-2 text-left">User</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.referrals.referralPurchases.map((purchase) => (
                        <tr
                          key={purchase.id}
                          className="border-t border-white/10"
                        >
                          <td className="px-3 py-2">
                            {purchase.userName ||
                              purchase.userEmail?.split("@")[0] ||
                              "Anonymous"}
                          </td>
                          <td className="px-3 py-2">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {purchase.lmxTokensAllocated && (
                              <div className="text-xs text-white/50">
                                {parseFloat(
                                  purchase.lmxTokensAllocated
                                ).toLocaleString()}{" "}
                                LMX
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                purchase.status === "completed"
                                  ? "bg-green-900/30 text-green-400"
                                  : purchase.status === "pending"
                                    ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-gray-900/30 text-gray-400"
                              }`}
                            >
                              {purchase.status}
                            </span>
                            {purchase.referralEarnings && (
                              <div className="text-xs text-green-400/70 mt-1">
                                +${purchase.referralEarnings.toFixed(2)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

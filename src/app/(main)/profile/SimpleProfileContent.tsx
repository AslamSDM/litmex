"use client";

import React from "react";
import { Session } from "next-auth";

interface ReferralPaymentStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidUsd: number;
  totalPendingUsd: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
}

interface UserData {
  purchases: any[];
  balance: number;
  purchaseCount: number;
  referrals: {
    count: number;
    totalBonus: number;
    purchases: any[];
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

interface SimpleProfileContentProps {
  userData: UserData;
  initialSession?: Session | null;
}

export default function SimpleProfileContent({
  userData,
  initialSession,
}: SimpleProfileContentProps) {
  return (
    <div className="container mx-auto py-24 px-4 md:px-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-black/40 p-6 rounded-lg mb-6 border border-primary/30">
        <h2 className="text-xl font-bold mb-2">Account Overview</h2>
        <p>Email: {initialSession?.user?.email || "Not logged in"}</p>
        <p>Total LMX Balance: {userData.balance.toLocaleString()}</p>
        <p>Total Purchases: {userData.purchaseCount}</p>
      </div>

      <div className="bg-black/40 p-6 rounded-lg mb-6 border border-primary/30">
        <h2 className="text-xl font-bold mb-2">Referrals</h2>
        <p>Referral Count: {userData.referrals.count}</p>
        <p>Total Bonus: {userData.referrals.totalBonus} TRUMP</p>
        {userData.referrals.referralStats && (
          <>
            <p>
              Pending Bonus:{" "}
              {userData.referrals.referralStats.totalPendingBonus} TRUMP
            </p>
            <p>Value (USD): ${userData.referrals.referralStats.totalUsd}</p>
            <p>
              Pending Value (USD): $
              {userData.referrals.referralStats.totalPendingUsd}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

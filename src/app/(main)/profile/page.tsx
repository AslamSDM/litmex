import React, { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import prisma from "@/lib/prisma";
import ProfileClientContent from "./ProfileClientContent";
import { parse } from "path";
import SimpleProfileContent from "./SimpleProfileContent";
import ErrorBoundary from "./ErrorBoundary";
import { PublicKey } from "@solana/web3.js";
import { getTokenDetails } from "@/lib/price-utils";

// Route segment config
export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate data every 60 seconds

interface Purchase {
  id: string;
  createdAt: Date;
  lmxTokensAllocated: any; // Using 'any' for the Decimal type from Prisma
  pricePerLmxInUsdt?: any; // Using 'any' for the Decimal type from Prisma
  status: string;
  network: string;
  transactionSignature: string;
}

interface ReferredUserPurchase extends Purchase {
  userEmail?: string | null;
  userName?: string | null;
}

interface ReferralPaymentStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidUsd: number;
  totalPendingUsd: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
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

async function getUserData(userId: string): Promise<UserData> {
  // Get user's purchase history
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
      lmxTokensAllocated: true,
      pricePerLmxInUsdt: true,
      status: true,
      network: true,
      transactionSignature: true,
    },
  });

  // Calculate total LMX balance from completed purchases
  const balance = purchases.reduce((total, purchase) => {
    // Convert Decimal to number for calculation
    const amount =
      typeof purchase.lmxTokensAllocated === "object"
        ? parseFloat(purchase.lmxTokensAllocated.toString())
        : parseFloat(purchase.lmxTokensAllocated || "0");
    return total + amount;
  }, 0);

  // Get referral data - users who have this user as their referrer
  const referredUsers = await prisma.user.findMany({
    where: {
      referrerId: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Get purchases made by referred users to calculate actual bonus
  let totalReferralBonus = 0;
  let referredUsersPurchases: ReferredUserPurchase[] = [];

  if (referredUsers.length > 0) {
    const referredUserIds = referredUsers.map((user) => user.id);

    // Get all completed purchases by referred users with detailed information
    const referralPurchases = await prisma.purchase.findMany({
      where: {
        userId: { in: referredUserIds },
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        lmxTokensAllocated: true,
        pricePerLmxInUsdt: true,
        status: true,
        network: true,
        transactionSignature: true,
        userId: true,
      },
    });
    // Calculate bonus as 5% of the referred purchases
    const referralBonusPercentage = 0.1;
    // Map purchases to their users and create the referredUsersPurchases array with earnings calculation

    referredUsersPurchases = referralPurchases.map((purchase) => {
      const referredUser = referredUsers.find(
        (user) => user.id === purchase.userId
      );

      // Calculate earnings for this purchase
      let lmxAmount =
        typeof purchase.lmxTokensAllocated === "object"
          ? parseFloat(purchase.lmxTokensAllocated.toString())
          : parseFloat(purchase.lmxTokensAllocated || "0");

      let pricePerLmx =
        typeof purchase.pricePerLmxInUsdt === "object"
          ? parseFloat(purchase.pricePerLmxInUsdt.toString())
          : parseFloat(purchase.pricePerLmxInUsdt || "0");

      const purchaseAmount = lmxAmount * pricePerLmx;
      const referralEarnings = purchaseAmount * referralBonusPercentage;

      return {
        ...purchase,
        pricePerLmxInUsdt: purchase.pricePerLmxInUsdt
          ? purchase.pricePerLmxInUsdt.toString()
          : null,
        userEmail: referredUser?.email || null,
        userName: null, // We don't have name in the schema
        referralEarnings: parseFloat(referralEarnings.toFixed(2)), // Add earnings information
      };
    });

    totalReferralBonus = referralPurchases.reduce((total, purchase) => {
      let lmxAmount =
        typeof purchase.lmxTokensAllocated === "object"
          ? parseFloat(purchase.lmxTokensAllocated.toString())
          : parseFloat(purchase.lmxTokensAllocated || "0");

      let pricePerLmx =
        typeof purchase.pricePerLmxInUsdt === "object"
          ? parseFloat(purchase.pricePerLmxInUsdt.toString())
          : parseFloat(purchase.pricePerLmxInUsdt || "0");

      const purchaseAmount = lmxAmount * pricePerLmx;

      return total + purchaseAmount * referralBonusPercentage;
    }, 0);
  }

  // Get referral payment stats
  const referralPaymentStats = await getReferralPaymentStats(userId);

  return {
    purchases,
    balance,
    purchaseCount: purchases.length,
    referrals: {
      count: referredUsers.length,
      totalBonus: parseFloat(totalReferralBonus.toFixed(2)),
      purchases: referredUsersPurchases,
      paymentStats: referralPaymentStats,
    },
  };
}

async function getReferralPaymentStats(
  userId: string
): Promise<ReferralPaymentStats> {
  try {
    // Use type assertion to work around Prisma client not having the new model yet
    // Get completed referral payments
    const completedPayments = await (prisma as any).referralPayment.findMany({
      where: {
        referrerId: userId,
        status: "COMPLETED",
      },
    });

    // Get pending referral payments
    const pendingPayments = await (prisma as any).referralPayment.findMany({
      where: {
        referrerId: userId,
        status: "PENDING",
      },
    });

    // Calculate total paid amount
    const totalPaidAmount = completedPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amount.toString()),
      0
    );

    // Calculate total pending amount
    const totalPendingAmount = pendingPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amount.toString()),
      0
    );

    // Calculate USD values
    const totalPaidUsd = completedPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amountUsd.toString()),
      0
    );

    const totalPendingUsd = pendingPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amountUsd.toString()),
      0
    );

    return {
      totalPaidAmount,
      totalPendingAmount,
      totalPaidUsd,
      totalPendingUsd,
      completedPaymentsCount: completedPayments.length,
      pendingPaymentsCount: pendingPayments.length,
    };
  } catch (error) {
    console.error("Error fetching referral payment stats:", error);
    return {
      totalPaidAmount: 0,
      totalPendingAmount: 0,
      totalPaidUsd: 0,
      totalPendingUsd: 0,
      completedPaymentsCount: 0,
      pendingPaymentsCount: 0,
    };
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  let userData: UserData = {
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
  };

  // Only fetch user data if the user is authenticated
  if (session?.user?.id) {
    userData = await getUserData(session.user.id);

    // Fetch additional referral stats for the ReferralCard
    if (session?.user?.referralCode) {
      try {
        // Simulate the API call that would be made on the client
        const referralUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            referralCode: true,
            solanaVerified: true,
            solanaAddress: true,
          },
        });

        // We'll add this data to the userData we pass to the client
        userData.referrals.referralStats = {
          totalBonus: userData.referrals.totalBonus.toString(),
          totalPendingBonus:
            userData.referrals.paymentStats.totalPendingAmount.toString(),
          totalUsd: userData.referrals.paymentStats.totalPaidUsd.toString(),
          totalPendingUsd:
            userData.referrals.paymentStats.totalPendingUsd.toString(),
          referralCount: userData.referrals.count,
          referralCode: referralUser?.referralCode || "",
          solanaVerified:
            !!referralUser?.solanaVerified || !!referralUser?.solanaAddress,
          payments: {
            completed: userData.referrals.paymentStats.completedPaymentsCount,
            pending: userData.referrals.paymentStats.pendingPaymentsCount,
          },
        };
      } catch (error) {
        console.error("Error fetching additional referral stats:", error);
      }
    }
  }

  // Convert the purchases to a format that's serializable for the client component
  // Make sure all properties are JSON-serializable
  const serializableUserData = {
    purchases: userData.purchases.map((purchase) => {
      // Extract any Decimal values
      const { pricePerLmxInUsdt, ...rest } = purchase;

      // Return a new object with serialized values
      return {
        ...rest,
        createdAt: purchase.createdAt.toISOString(),
        lmxTokensAllocated: purchase.lmxTokensAllocated.toString(),
        pricePerLmxInUsdt: pricePerLmxInUsdt
          ? pricePerLmxInUsdt.toString()
          : null,
      };
    }),
    balance: userData.balance,
    purchaseCount: userData.purchaseCount,
    referrals: {
      count: userData.referrals.count,
      totalBonus: userData.referrals.totalBonus,
      purchases: userData.referrals.purchases.map((purchase) => {
        // Extract any Decimal values
        const { pricePerLmxInUsdt, ...rest } = purchase;

        // Return a new object with serialized values
        return {
          ...rest,
          createdAt: purchase.createdAt.toISOString(),
          lmxTokensAllocated: purchase.lmxTokensAllocated.toString(),
          pricePerLmxInUsdt: pricePerLmxInUsdt
            ? pricePerLmxInUsdt.toString()
            : null,
        };
      }),
      paymentStats: userData.referrals.paymentStats,
      referralStats: userData.referrals.referralStats,
    },
  };
  // Your SPL token mint address
  const TOKEN_MINT = new PublicKey(
    "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
  );
  const trump = await getTokenDetails(TOKEN_MINT.toString());
  const trumpPrice = Number(trump?.priceUsd) || 8;
  // Convert to JSON and back to ensure all values are serializable
  const jsonString = JSON.stringify(serializableUserData);
  const jsonSafeData = JSON.parse(jsonString);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 bg-black/50 backdrop-blur-md rounded-lg border border-primary/20 text-center">
        <h2 className="text-2xl font-bold mb-4">Loading Profile...</h2>
        <p className="text-gray-400">
          Please wait while we load your profile data
        </p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary
        fallback={
          <SimpleProfileContent
            userData={jsonSafeData}
            initialSession={session}
          />
        }
      >
        <ProfileClientContent
          userData={jsonSafeData}
          initialSession={session}
          trupPrice={trumpPrice}
        />
      </ErrorBoundary>
    </Suspense>
  );
}

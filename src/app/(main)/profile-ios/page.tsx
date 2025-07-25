import React, { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/next-auth";
import prisma from "@/lib/prisma";
import { PublicKey } from "@solana/web3.js";
import { getTokenDetails } from "@/lib/price-utils";
import ProfileIOSClient from "./ProfileIOSClient";

// Use dynamic rendering to ensure data is always fresh
export const dynamic = "force-dynamic";
export const revalidate = 600; // Revalidate data every 60 seconds

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
    referredUsers?: Array<{
      id: string;
      email?: string | null;
      name?: string | null;
      createdAt: string;
    }>;
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

async function getUserData(
  userId: string,
  trumpPrice: number
): Promise<UserData> {
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
      username: true,
      createdAt: true,
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
    // Calculate bonus as 10% of the referred purchases
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
      const referralEarnings =
        (purchaseAmount * referralBonusPercentage) / trumpPrice;

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

  // Transform referredUsers to match the format we need
  const processedReferredUsers = referredUsers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.username,
    createdAt: user.createdAt.toISOString(),
  }));

  return {
    purchases,
    balance,
    purchaseCount: purchases.length,
    referrals: {
      count: referredUsers.length,
      totalBonus: parseFloat(totalReferralBonus.toFixed(2)),
      purchases: referredUsersPurchases,
      paymentStats: referralPaymentStats,
      referredUsers: processedReferredUsers, // Adding all referred users
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

export default async function ProfileIOSPage() {
  // Get session data
  const session = await getServerSession(authOptions);

  // Redirect unauthenticated users
  if (!session?.user) {
    redirect("/auth/signin");
  }

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
  // Your SPL token mint address
  const TOKEN_MINT = new PublicKey(
    "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
  );
  const trump = await getTokenDetails(TOKEN_MINT.toString());
  const trumpPrice = Number(trump?.priceUsd) || 8;
  // Only fetch user data if the user is authenticated
  if (session?.user?.id) {
    userData = await getUserData(session.user.id, trumpPrice);

    // Fetch additional referral stats for the ReferralCard
    if (session?.user?.referralCode) {
      try {
        // Get referral user data
        const referralUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            referralCode: true,
            solanaVerified: true,
            solanaAddress: true,
          },
        });

        // Add this data to the userData we pass to the client
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
      referredUsers: userData.referrals.referredUsers,
      paymentStats: userData.referrals.paymentStats,
      referralStats: userData.referrals.referralStats,
    },
  };

  // Convert to JSON and back to ensure all values are serializable
  const jsonString = JSON.stringify(serializableUserData);
  const jsonSafeData = JSON.parse(jsonString);

  // Prepare the client data format that matches the ProfileIOSClient props interface
  const clientUserData = {
    balance: jsonSafeData.balance,
    referrals: {
      count: jsonSafeData.referrals.count,
      totalBonus: jsonSafeData.referrals.totalBonus,
      paymentStats: {
        totalPaidAmount: jsonSafeData.referrals.paymentStats.totalPaidAmount,
        totalPendingAmount:
          jsonSafeData.referrals.paymentStats.totalPendingAmount,
      },
      referralStats: jsonSafeData.referrals.referralStats
        ? {
            referralCode: jsonSafeData.referrals.referralStats.referralCode,
            totalBonus: jsonSafeData.referrals.referralStats.totalBonus,
            totalPendingBonus:
              jsonSafeData.referrals.referralStats.totalPendingBonus,
          }
        : undefined,
      referralPurchases: jsonSafeData.referrals.purchases,

      referredUsers: jsonSafeData.referrals.referredUsers || [],
    },
    purchases: jsonSafeData.purchases,
  };

  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfileIOSClient
        initialUserData={clientUserData}
        trumpPrice={trumpPrice}
      />
    </Suspense>
  );
}

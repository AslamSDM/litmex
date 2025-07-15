import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

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

interface ReferralBalanceResponse {
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

// Recursive function to get referrals at each level
async function getReferralsAtLevel(
  userIds: string[],
  currentLevel: number,
  maxLevel: number = 5
): Promise<{ [level: number]: string[] }> {
  if (currentLevel > maxLevel || userIds.length === 0) {
    return {};
  }

  const directReferrals = await prisma.user.findMany({
    where: {
      referrerId: { in: userIds },
    },
    select: {
      id: true,
    },
  });

  const referralIds = directReferrals.map((r) => r.id);
  const result: { [level: number]: string[] } = {};
  result[currentLevel] = referralIds;

  if (currentLevel < maxLevel && referralIds.length > 0) {
    const nextLevels = await getReferralsAtLevel(
      referralIds,
      currentLevel + 1,
      maxLevel
    );
    Object.assign(result, nextLevels);
  }

  return result;
}

// Calculate earnings for a set of referrals
async function calculateLevelEarnings(
  referralIds: string[],
  level: number,
  trumpPrice: number = 8
): Promise<{
  totalEarnings: number;
  totalEarningsUsd: number;
  referrals: ReferralLevelData["referrals"];
}> {
  if (referralIds.length === 0) {
    return {
      totalEarnings: 0,
      totalEarningsUsd: 0,
      referrals: [],
    };
  }

  const referralBonusPercentage = 0.15; // 15% as defined in the component

  // Get detailed referral data with their purchases
  const referralsWithPurchases = await prisma.user.findMany({
    where: {
      id: { in: referralIds },
    },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      purchases: {
        where: {
          status: "COMPLETED",
          roundId: "presale",
        },
        select: {
          lmxTokensAllocated: true,
          pricePerLmxInUsdt: true,
          paymentAmount: true,
          paymentCurrency: true,
        },
      },
    },
  });

  let totalEarnings = 0;
  let totalEarningsUsd = 0;

  const referrals = referralsWithPurchases.map((referral) => {
    // Calculate total purchase amount for this referral
    let totalPurchaseAmount = 0;
    let bonusEarned = 0;

    referral.purchases.forEach((purchase) => {
      const lmxAmount = parseFloat(purchase.lmxTokensAllocated.toString());
      const pricePerLmx = parseFloat(
        purchase.pricePerLmxInUsdt?.toString() || "0"
      );
      const purchaseAmountUsd = lmxAmount * pricePerLmx;

      totalPurchaseAmount += purchaseAmountUsd;

      // Calculate bonus earned (15% of purchase in LMX tokens)
      const bonusInUsd = purchaseAmountUsd * referralBonusPercentage;
      bonusEarned += bonusInUsd;
    });

    totalEarnings += bonusEarned / trumpPrice; // Convert to TRUMP tokens
    totalEarningsUsd += bonusEarned;

    return {
      id: referral.id,
      email: referral.email,
      username: referral.username,
      createdAt: referral.createdAt.toISOString(),
      totalPurchases: referral.purchases.length,
      totalPurchaseAmount,
      bonusEarned: bonusEarned / trumpPrice, // In TRUMP tokens
    };
  });

  return {
    totalEarnings,
    totalEarningsUsd,
    referrals,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current token price (defaulting to 8 if not available)
    const trumpPrice = 8; // This could be fetched from your price API

    // Get referrals at each level (1-5)
    const allLevelReferrals = await getReferralsAtLevel([userId], 1, 5);

    const levels: ReferralLevelData[] = [];
    let totalEarnings = 0;
    let totalEarningsUsd = 0;
    let totalReferrals = 0;

    // Process each level
    for (let level = 1; level <= 5; level++) {
      const referralIds = allLevelReferrals[level] || [];
      totalReferrals += referralIds.length;

      const levelEarnings = await calculateLevelEarnings(
        referralIds,
        level,
        trumpPrice
      );

      totalEarnings += levelEarnings.totalEarnings;
      totalEarningsUsd += levelEarnings.totalEarningsUsd;

      levels.push({
        level,
        title: `Level ${level}${level === 1 ? " - Direct Referrals" : ""}`,
        description:
          level === 1
            ? "Your direct invites"
            : level === 2
              ? "Your referrals' referrals"
              : `${["Third", "Fourth", "Fifth"][level - 3]} level connections`,
        percentage: 15,
        referralCount: referralIds.length,
        totalEarnings: levelEarnings.totalEarnings,
        totalEarningsUsd: levelEarnings.totalEarningsUsd,
        referrals: levelEarnings.referrals,
      });
    }

    // Get payment statistics
    const [completedPayments, pendingPayments] = await Promise.all([
      (prisma as any).referralPayment.findMany({
        where: {
          referrerId: userId,
          status: "COMPLETED",
        },
      }),
      (prisma as any).referralPayment.findMany({
        where: {
          referrerId: userId,
          status: "PENDING",
        },
      }),
    ]);

    const totalPaidAmount = completedPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amount.toString()),
      0
    );

    const totalPendingAmount = pendingPayments.reduce(
      (sum: number, payment: any) =>
        sum + parseFloat(payment.amount.toString()),
      0
    );

    const response: ReferralBalanceResponse = {
      userId,
      referralCode: user.referralCode,
      totalEarnings,
      totalEarningsUsd,
      totalReferrals,
      levels,
      summary: {
        completedPayments: completedPayments.length,
        pendingPayments: pendingPayments.length,
        totalPaidAmount,
        totalPendingAmount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error calculating referral balances:", error);
    return NextResponse.json(
      { error: "Failed to calculate referral balances" },
      { status: 500 }
    );
  }
}

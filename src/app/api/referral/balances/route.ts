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

// Recursive function to get referrals at each level with circular reference prevention
async function getReferralsAtLevel(
  userIds: string[],
  currentLevel: number,
  maxLevel: number = 5,
  visitedUsers: Set<string> = new Set()
): Promise<{ [level: number]: string[] }> {
  if (currentLevel > maxLevel || userIds.length === 0) {
    return {};
  }

  // Filter out any userIds that we've already visited to prevent cycles
  const validUserIds = userIds.filter((userId) => !visitedUsers.has(userId));

  if (validUserIds.length === 0) {
    return {};
  }

  // Add current users to visited set
  validUserIds.forEach((userId) => visitedUsers.add(userId));

  const directReferrals = await prisma.user.findMany({
    where: {
      referrerId: { in: validUserIds },
      // Additional check: ensure referred user is not in the ancestor chain
      NOT: {
        id: { in: Array.from(visitedUsers) },
      },
    },
    select: {
      id: true,
    },
  });

  const referralIds = directReferrals.map((r) => r.id);
  const result: { [level: number]: string[] } = {};
  result[currentLevel] = referralIds;

  if (currentLevel < maxLevel && referralIds.length > 0) {
    // Create a new Set that includes all previously visited users
    const nextVisitedUsers = new Set(visitedUsers);

    const nextLevels = await getReferralsAtLevel(
      referralIds,
      currentLevel + 1,
      maxLevel,
      nextVisitedUsers
    );
    Object.assign(result, nextLevels);
  }

  return result;
}

// Calculate earnings for a set of referrals (optimized for parallel execution)
async function calculateLevelEarnings(
  referralIds: string[],
  level: number
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

  // Use Promise.resolve to handle empty arrays efficiently
  if (referralIds.length === 0) {
    return Promise.resolve({
      totalEarnings: 0,
      totalEarningsUsd: 0,
      referrals: [],
    });
  }

  // Get detailed referral data with their purchases in a single optimized query
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
    let bonusEarnedUSD = 0;
    let bonusEarned = 0;

    referral.purchases.forEach((purchase) => {
      const lmxAmount = parseFloat(purchase.lmxTokensAllocated.toString());
      const pricePerLmx = parseFloat(
        purchase.pricePerLmxInUsdt?.toString() || "0"
      );
      const purchaseAmountUsd = lmxAmount * pricePerLmx;
      const purchaseAmount = lmxAmount;

      totalPurchaseAmount += purchaseAmountUsd;

      // Calculate bonus earned (15% of purchase in LMX tokens)
      const bonusInUsd = purchaseAmountUsd * referralBonusPercentage;
      bonusEarnedUSD += bonusInUsd;
      bonusEarned += purchaseAmount * referralBonusPercentage;
    });

    totalEarnings += bonusEarned;
    totalEarningsUsd += bonusEarnedUSD;

    return {
      id: referral.id,
      email: referral.email,
      username: referral.username,
      createdAt: referral.createdAt.toISOString(),
      totalPurchases: referral.purchases.length,
      totalPurchaseAmount,
      bonusEarned: bonusEarned,
    };
  });

  return {
    totalEarnings,
    totalEarningsUsd,
    referrals,
  };
}

// Add validation functions to prevent circular referrals
async function validateReferralRelationship(
  referrerId: string,
  refereeId: string
): Promise<{ isValid: boolean; error?: string }> {
  // Check if referee is trying to refer their own referrer (direct cycle)
  const directCycle = await prisma.user.findFirst({
    where: {
      id: referrerId,
      referrerId: refereeId,
    },
  });

  if (directCycle) {
    return {
      isValid: false,
      error: "Cannot create circular referral: User is already your referrer",
    };
  }

  // Check if referrer is in the referee's referral chain (indirect cycle)
  const refereeAncestors = await getReferralAncestors(refereeId);

  if (refereeAncestors.includes(referrerId)) {
    return {
      isValid: false,
      error: "Cannot create circular referral: User is in your referral chain",
    };
  }

  return { isValid: true };
}

// Helper function to get all ancestors in referral chain
async function getReferralAncestors(
  userId: string,
  visitedUsers: Set<string> = new Set()
): Promise<string[]> {
  // Prevent infinite loops
  if (visitedUsers.has(userId)) {
    return [];
  }

  visitedUsers.add(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referrerId: true },
  });

  if (!user?.referrerId) {
    return [];
  }

  const ancestors = await getReferralAncestors(user.referrerId, visitedUsers);
  return [user.referrerId, ...ancestors];
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

    // Get referrals at each level (1-5) with circular reference prevention and payment statistics in parallel
    const visitedUsers = new Set<string>();
    const [allLevelReferrals, completedPayments, pendingPayments] =
      await Promise.all([
        getReferralsAtLevel([userId], 1, 5, visitedUsers),
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

    // Process all levels in parallel
    const levelPromises = [];
    for (let level = 1; level <= 5; level++) {
      const referralIds = allLevelReferrals[level] || [];
      levelPromises.push(calculateLevelEarnings(referralIds, level));
    }

    const levelEarningsResults = await Promise.all(levelPromises);

    const levels: ReferralLevelData[] = [];
    let totalEarnings = 0;
    let totalEarningsUsd = 0;
    let totalReferrals = 0;

    // Build levels array with results
    levelEarningsResults.forEach((levelEarnings, index) => {
      const level = index + 1;
      const referralIds = allLevelReferrals[level] || [];
      totalReferrals += referralIds.length;
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
    });

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

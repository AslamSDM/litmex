import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { ERROR_TYPES } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: ERROR_TYPES.AUTH_REQUIRED.message,
          code: ERROR_TYPES.AUTH_REQUIRED.code,
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get the user with their referral data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        solanaVerified: true,
        referrals: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: ERROR_TYPES.USER_NOT_FOUND.message,
          code: ERROR_TYPES.USER_NOT_FOUND.code,
        },
        { status: 404 }
      );
    }

    // Count the number of referrals
    const referralCount = user.referrals.length;

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

    // Calculate total bonus amount from completed payments
    const totalPaidBonus = completedPayments.reduce(
      (sum: number, payment: { amount: any }) => sum + Number(payment.amount),
      0
    );

    // Calculate total pending bonus amount
    const totalPendingBonus = pendingPayments.reduce(
      (sum: number, payment: { amount: any }) => sum + Number(payment.amount),
      0
    );

    // Calculate USD value
    const totalPaidUsd = completedPayments.reduce(
      (sum: number, payment: { amountUsd: Decimal }) =>
        sum + Number(payment.amountUsd),
      0
    );

    const totalPendingUsd = pendingPayments.reduce(
      (sum: number, payment: { amountUsd: Decimal }) =>
        sum + Number(payment.amountUsd),
      0
    );

    // Use old calculation method as fallback if no referral payments exist yet
    let legacyTotalBonus = new Decimal(0);
    if (completedPayments.length === 0) {
      // Calculate the total bonus earned from referrals using the old method
      const referralPurchases = await prisma.purchase.findMany({
        where: {
          user: {
            referrerId: userId,
          },
          status: "COMPLETED",
          referralBonusPaid: true,
        },
        select: {
          lmxTokensAllocated: true,
        },
      });

      // Calculate total bonuses (assuming bonus is some percentage of the tokens allocated)
      const bonusPercentage = 0.05; // 5% bonus
      legacyTotalBonus = referralPurchases.reduce((sum, purchase) => {
        // Calculate the bonus for this referral purchase
        const bonusAmount = purchase.lmxTokensAllocated.mul(
          new Decimal(bonusPercentage)
        );
        return sum.add(bonusAmount);
      }, new Decimal(0));
    }

    // Use the new system value or fall back to legacy calculation
    const totalBonus =
      completedPayments.length > 0
        ? totalPaidBonus
        : Number(legacyTotalBonus.toString());

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount,
      totalBonus: totalBonus.toString(),
      totalPendingBonus: totalPendingBonus.toString(),
      totalUsd: totalPaidUsd.toString(),
      totalPendingUsd: totalPendingUsd.toString(),
      solanaVerified: user.solanaVerified,
      payments: {
        completed: completedPayments.length,
        pending: pendingPayments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch referral stats",
        code: ERROR_TYPES.SERVER_ERROR.code,
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { ERROR_TYPES } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
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

    // Get all pending transactions for the user
    const pendingTransactions = await (prisma as any).transaction.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      pendingTransactions,
    });
  } catch (error) {
    console.error("Error fetching pending transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending transactions" },
      { status: 500 }
    );
  }
}

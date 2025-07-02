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
    // Get wallet address from query param only

    // Find user by their wallet address
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
      return NextResponse.json({ purchases: [] }, { status: 200 });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        lmxTokensAllocated: true,
        status: true,
        network: true,
        transactionSignature: true,
      },
    });

    return NextResponse.json({
      purchases: purchases || [],
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase history" },
      { status: 500 }
    );
  }
}

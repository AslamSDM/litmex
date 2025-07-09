import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/next-auth";

const prisma = new PrismaClient();

const getUserBalance = async (userId: string): Promise<number> => {
  // Get user's purchase history
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
    },
    select: {
      lmxTokensAllocated: true,
    },
  });

  // Calculate total balance from purchases
  return purchases.reduce(
    (total, purchase) =>
      total +
      (purchase.lmxTokensAllocated ? Number(purchase.lmxTokensAllocated) : 0),
    0
  );
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balance = await getUserBalance(session.user.id);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}

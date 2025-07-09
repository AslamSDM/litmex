import { Suspense, cache } from "react";
import PresaleClientContent from "./PresaleClientContent";
import getPresaleData from "./getPresaleData";
import { Header } from "@/components/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import prisma from "@/lib/prisma";

// export const dynamic = "force-dynamic";
// export const revalidate = 600; // Revalidate data every 60 seconds

const getUserBalance = cache(async (userId: string): Promise<number> => {
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

  // Calculate total LMX balance from completed purchases
  return purchases.reduce((total, purchase) => {
    // Convert Decimal to number for calculation
    const amount =
      typeof purchase.lmxTokensAllocated === "object"
        ? parseFloat(purchase.lmxTokensAllocated.toString())
        : parseFloat(purchase.lmxTokensAllocated || "0");
    return total + amount;
  }, 0);
});

export default async function PresalePage() {
  const presaleData = await getPresaleData();
  const session = await getServerSession(authOptions);

  // Get user balance if user is logged in
  let userBalance = 0;
  // if (session?.user?.id) {
  //   userBalance = await getUserBalance(session.user.id);
  // }

  return (
    <Suspense fallback={<div>Loading presale...</div>}>
      <Header />
      <PresaleClientContent
        contributorCount={presaleData.contributorCount}
        totalRaised={presaleData.totalRaised}
        usdRaised={presaleData.usdRaised}
        prices={presaleData.prices}
        userBalance={userBalance}
        initialSession={session}
      />
    </Suspense>
  );
}

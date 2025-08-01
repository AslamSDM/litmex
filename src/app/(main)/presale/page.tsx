import { Suspense, cache } from "react";
import PresaleClientContent from "./PresaleClientContent";
import getPresaleData from "./getPresaleData";
import { Header } from "@/components/Header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { redirect } from "next/navigation";

// export const dynamic = "force-dynamic";
// export const revalidate = 600; // Revalidate data every 60 seconds

export default async function PresalePage() {
  // const presaleData = await getPresaleData();
  const session = await getServerSession(authOptions);
  const presaleData = await cache(getPresaleData)();

  // Get user balance if user is logged in
  let userBalance = 0;
  // if (session?.user?.id) {
  //   userBalance = await getUserBalance(session.user.id);
  // }
  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  return (
    <Suspense fallback={<div>Loading presale...</div>}>
      <Header />
      <PresaleClientContent
        contributorCount={161}
        // contributorCount={presaleData.contributorCount || 0}
        totalRaised={41000 / 185}
        // totalRaised={presaleData.totalRaised || 0}
        // usdRaised={presaleData.usdRaised || 0}
        usdRaised={41000}
        prices={presaleData.prices || 0}
        userBalance={userBalance}
        initialSession={session}
      />
    </Suspense>
  );
}

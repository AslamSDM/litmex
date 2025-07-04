import { Suspense } from "react";
import PresaleClientContent from "./PresaleClientContent";
import getPresaleData from "./getPresaleData";
import { Header } from "@/components/Header";

// export const dynamic = "force-dynamic";
// export const revalidate = 600; // Revalidate data every 60 seconds

export default async function PresalePage() {
  const presaleData = await getPresaleData();

  return (
    <Suspense fallback={<div>Loading presale...</div>}>
      <Header />
      <PresaleClientContent
        contributorCount={presaleData.contributorCount}
        totalRaised={presaleData.totalRaised}
        usdRaised={presaleData.usdRaised}
        prices={presaleData.prices}
      />
    </Suspense>
  );
}

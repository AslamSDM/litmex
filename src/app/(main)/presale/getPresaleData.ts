// src/app/presale/getPresaleData.ts
import prisma from "@/lib/prisma";
import { presaleCache } from "@/lib/createCache";
import { fetchCryptoPrices } from "@/lib/price-utils";
import { LMX_PRICE } from "@/lib/constants";

export default async function getPresaleData() {
  // Check if we have cached data
  const cachedData = presaleCache.get("presaleStats");
  if (cachedData) {
    console.log("Using cached presale data");
    return cachedData;
  }

  try {
    console.log("Fetching fresh presale data from database");

    // Get total number of contributors
    const contributors = await prisma.purchase.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED" },
    });
    const contributorCount = contributors.length;

    // Get total raised in SOL
    const totalRaised = await prisma.purchase.aggregate({
      _sum: {
        lmxTokensAllocated: true,
      },
      where: {
        status: "COMPLETED",
        network: { in: ["SOLANA", "BSC"] },
      },
    });

    // Convert SOL to USD (approximation - would be better with real exchange rate API)
    // Assuming 1 SOL = $170 USD (example value, would need real-time price feed)
    const prices = await fetchCryptoPrices();
    const solPrice = prices.sol || 150;
    const lmxRaised = totalRaised._sum.lmxTokensAllocated || 0;
    const usdRaised = parseFloat(lmxRaised.toString()) * LMX_PRICE;
    console.log("Total LMX raised:", lmxRaised, usdRaised);
    const solRaised = usdRaised / solPrice;

    const result = {
      contributorCount: contributorCount || 0,
      totalRaised: parseFloat(solRaised.toString()) || 0,
      usdRaised: usdRaised || 0,
      prices: {
        bnb: prices.bnb || 600, // Default BNB price if not available
        sol: prices.sol || 150, // Default SOL price if not available
      },
    };

    // Store in cache for 60 seconds
    presaleCache.set("presaleStats", result);

    return result;
  } catch (error) {
    console.error("Failed to fetch presale data:", error);
    return {
      contributorCount: 0,
      totalRaised: 0,
      usdRaised: 0,
      prices: {
        bnb: 600,
        sol: 150,
      },
    };
  }
}

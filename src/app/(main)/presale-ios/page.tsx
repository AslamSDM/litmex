import React from "react";
import SimplePresalePage from "./PrealeIOSClient";
import { fetchCryptoPrices } from "@/lib/price-utils";

// Define types for crypto prices
interface CryptoPrices {
  bnb: number;
  sol: number;
  usdt: number;
  // Add other cryptos as needed
}

// Server component to fetch crypto prices
async function getServerSideData(): Promise<CryptoPrices> {
  try {
    const prices = await fetchCryptoPrices();
    return {
      bnb: prices.bnb || 500, // Default to 500 if not available
      sol: prices.sol || 150, // Default to 150 if not available
      usdt: 1, // Default to 1 if not available
      // Add other cryptos with defaults as needed
    };
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    return {
      bnb: 500,
      sol: 150,
      usdt: 1,
    };
  }
}

export default async function PresaleIOS() {
  const cryptoPrices = await getServerSideData();

  return (
    <>
      <SimplePresalePage
        bnb={cryptoPrices.bnb}
        sol={cryptoPrices.sol}
        usdt={cryptoPrices.usdt}
      />
    </>
  );
}

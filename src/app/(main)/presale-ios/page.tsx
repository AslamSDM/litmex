"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppKitNetwork, useAppKitAccount } from "@reown/appkit/react";
import { solana, bsc } from "@reown/appkit/networks";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown } from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";

// Network icons
const NETWORK_ICONS = {
  BSC: "/icons/bsc.svg",
  SOLANA: "/icons/solana.svg",
};

// Currency icons
const CURRENCY_ICONS = {
  BNB: "/icons/bnb.svg",
  SOL: "/icons/sol.svg",
  USDT: "/icons/usdt.svg",
};

const MIN_BUY = 50; // Minimum purchase amount in USD

export default function SimplePresalePage() {
  // State for purchase amounts
  const [usdAmount, setUsdAmount] = useState<number>(500);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);

  // Network and currency selection
  const [network, setNetwork] = useState<"bsc" | "solana">("bsc");
  const [bscCurrency, setBscCurrency] = useState<"BNB" | "USDT">("BNB");
  const [solanaCurrency, setSolanaCurrency] = useState<"SOL" | "USDT">("SOL");

  // Access appkit hooks for wallet connection
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { isConnected, address } = useAppKitAccount();
  const { data: session } = useSession();

  const cryptoPrices = {
    bnb: 300, // Example price, replace with actual data
    sol: 20, // Example price, replace with actual data
    usdt: 1, // USDT is typically 1 USD
  };
  const lmxPriceUsd = 0.014; // Example LMX price in USD, replace with actual data

  // Get presale functionality from the usePresale hook

  // Handle wallet connection status
  const hasWalletConnected = isConnected && address;

  // Set currency symbol based on selected network and currency
  const currencySymbol = network === "bsc" ? bscCurrency : solanaCurrency;

  // Handle network switch
  const handleNetworkChange = (newNetwork: "bsc" | "solana") => {
    switchNetwork(newNetwork === "bsc" ? bsc : solana);
    setNetwork(newNetwork);
  };

  // Reset to default SOL currency when network changes to Solana
  useEffect(() => {
    if (network === "solana") {
      setSolanaCurrency("SOL");
    } else {
      setBscCurrency("BNB");
    }
  }, [network]);

  // Update amounts when USD value changes
  const updateAmounts = (usdValue: number) => {
    if (!cryptoPrices || !lmxPriceUsd) return;

    // Calculate LMX tokens from USD
    const tokens = usdValue / lmxPriceUsd;
    setTokenAmount(tokens);

    // Calculate crypto amount from USD
    if (network === "bsc") {
      if (bscCurrency === "BNB") {
        const bnbCost = usdValue / cryptoPrices.bnb;
        setCryptoAmount(parseFloat(bnbCost.toFixed(8))); // BNB precision
      } else {
        // For USDT on BSC, the USD value is the same as the USDT amount (1:1)
        setCryptoAmount(parseFloat(usdValue.toFixed(2))); // USDT typically has 2 decimal places in UI
      }
    } else {
      if (solanaCurrency === "SOL") {
        const solCost = usdValue / cryptoPrices.sol;
        setCryptoAmount(parseFloat(solCost.toFixed(9))); // SOL has 9 decimals
      } else {
        // For USDT, the USD value is the same as the USDT amount (1:1)
        setCryptoAmount(parseFloat(usdValue.toFixed(2))); // USDT typically has 2 decimal places in UI
      }
    }
  };

  // Run calculation when network changes or when prices update
  useEffect(() => {
    if (usdAmount > 0 && cryptoPrices && lmxPriceUsd) {
      updateAmounts(usdAmount);
    }
  }, [
    network,
    cryptoPrices,
    bscCurrency,
    solanaCurrency,
    usdAmount,
    lmxPriceUsd,
  ]);

  // Handle USD amount change with validation
  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);

    if (isNaN(value) || value < 0) {
      setUsdAmount(0);
      setTokenAmount(0);
      setCryptoAmount(0);
      return;
    }

    setUsdAmount(value);
    updateAmounts(value);
  };

  // Handle purchase button click
  const handleBuy = () => {
    if (!hasWalletConnected) {
      toast.error(`Please connect your wallet first`);
      return;
    }

    if (usdAmount < MIN_BUY) {
      toast.error(`Minimum purchase amount is $${MIN_BUY.toFixed(2)} USD`);
      return;
    }

    toast.success(
      `Purchase initiated for ${tokenAmount.toFixed(2)} LMX tokens with ${cryptoAmount.toFixed(currencySymbol === "USDT" ? 2 : 6)} ${currencySymbol}`
    );
    // In a real implementation, you would call the appropriate buy function here
  };

  // Refresh price data
  //   const refreshPrices = async () => {
  //     toast.info("Refreshing cryptocurrency prices...");
  //     await loadCryptoPrices(false);
  //     toast.success("Cryptocurrency prices updated");
  //   };

  return (
    <div className="container mx-auto py-24 px-4 md:px-8 min-h-screen relative mt-24 overflow-hidden">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-md rounded-xl p-6 border border-primary/10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Buy LMX Tokens</h2>
          <div className="flex items-center gap-3">
            {/* Network selector with icons */}
            <div className="bg-black/30 rounded-md p-1 border border-primary/20">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNetworkChange("bsc")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    network === "bsc"
                      ? "bg-primary/30 text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Image
                    src={NETWORK_ICONS.BSC}
                    alt="BSC"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span>BSC</span>
                </button>
                <button
                  onClick={() => handleNetworkChange("solana")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    network === "solana"
                      ? "bg-primary/30 text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Image
                    src={NETWORK_ICONS.SOLANA}
                    alt="Solana"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span>Solana</span>
                </button>
              </div>
            </div>

            {/* Currency selector dropdown */}
            <div className="relative">
              <div
                className="flex items-center gap-1 px-3 py-1 bg-black/30 rounded-md cursor-pointer border border-primary/20 hover:bg-black/40 transition-colors text-sm text-white"
                onClick={() => {
                  if (network === "solana") {
                    setSolanaCurrency(
                      solanaCurrency === "SOL" ? "USDT" : "SOL"
                    );
                  } else {
                    setBscCurrency(bscCurrency === "BNB" ? "USDT" : "BNB");
                  }
                }}
              >
                <Image
                  src={
                    network === "solana"
                      ? solanaCurrency === "SOL"
                        ? CURRENCY_ICONS.SOL
                        : CURRENCY_ICONS.USDT
                      : bscCurrency === "BNB"
                        ? CURRENCY_ICONS.BNB
                        : CURRENCY_ICONS.USDT
                  }
                  alt="Currency"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span>
                  {network === "solana" ? solanaCurrency : bscCurrency}
                </span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {!cryptoPrices ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-primary/70 text-center">Loading price data...</p>
          </div>
        ) : (
          <>
            {/* Current Price Information */}
            <div className="mb-6 p-3 bg-black/40 rounded-lg border border-primary/10">
              <div className="text-sm font-medium text-white/80 mb-2">
                Token Price Information:
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-400 font-bold">
                  ${lmxPriceUsd?.toFixed(4) || "0.014"} per LMX
                </span>
                <span className="text-xs text-white/60">Fixed USD Price</span>
              </div>
            </div>

            {/* USD Amount Input */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="usdAmount" className="text-sm text-white/70">
                  Amount in USD
                </Label>
              </div>

              <div className="flex gap-2 items-center">
                <Input
                  id="usdAmount"
                  type="number"
                  value={usdAmount}
                  onChange={handleUsdAmountChange}
                  className="bg-black/30 border border-primary/20 text-white"
                  step="1"
                  placeholder="500"
                  min="50"
                />
                <div className="bg-black/40 px-3 py-2 rounded-md text-white/80">
                  USD
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mt-2 text-sm text-center text-white/70">
                ≈ {isNaN(tokenAmount) ? "0.00" : tokenAmount.toFixed(2)} LMX
                <span className="mx-2 text-white/40">|</span>
                {isNaN(cryptoAmount)
                  ? "0.00"
                  : cryptoAmount.toFixed(
                      currencySymbol === "USDT"
                        ? 2
                        : currencySymbol === "SOL"
                          ? 4
                          : 6
                    )}{" "}
                {currencySymbol}
              </div>
            </div>

            {/* Buy Button */}
            <div className="mb-4">
              {!hasWalletConnected ? (
                <WalletConnectButton className="w-full py-3" />
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={usdAmount < MIN_BUY}
                  className="w-full py-3 bg-gradient-to-br from-indigo-600/90 to-violet-700 hover:from-indigo-600 hover:to-violet-600 border-indigo-400/30 text-white font-medium transition-all duration-200 rounded-md"
                >
                  ( `Buy ${tokenAmount.toFixed(2)} LMX` )
                </button>
              )}

              {/* Wallet status indicators */}
              <div
                className={`mt-2 text-sm text-center ${
                  hasWalletConnected ? "text-green-400" : "text-amber-400"
                }`}
              >
                {hasWalletConnected ? (
                  <span>Wallet Connected</span>
                ) : (
                  <span>Connect your wallet to buy</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

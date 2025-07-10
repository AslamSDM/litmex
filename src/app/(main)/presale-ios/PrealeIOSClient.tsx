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
import { useRouter } from "next/navigation";
import { useBscUsdtPresale } from "@/components/hooks/useBscUsdtPresale";
import { useSolanaPresale } from "@/components/hooks/useSolanaPresale";
import { useSolanaUsdtPresale } from "@/components/hooks/useSolanaUsdtPresale";
import { useBscPresale } from "@/components/hooks/useBscPresale";
import { useWalletBalances } from "@/components/hooks/useWalletBalances";
import { MIN_BUY } from "@/lib/constants";
import TransactionStatusModal from "@/components/TransactionStatusModal";
import useReferralHandling from "@/components/hooks/useReferralHandling";

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

export default function SimplePresalePage(cryptoPrices: {
  bnb: number;
  sol: number;
  usdt: number;
}) {
  // State for purchase amounts
  const [usdAmount, setUsdAmount] = useState<number>(500);
  const [tokenAmount, setTokenAmount] = useState<number>(35714.2857142857); // Derived from USD amount
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);

  const [showSolanaVerificationModal, setShowSolanaVerificationModal] =
    useState(false);
  const [showBSCVerificationModal, setShowBSCVerificationModal] =
    useState(false);

  // Network and currency selection
  const [network, setNetwork] = useState<"bsc" | "solana">("bsc");
  const [bscCurrency, setBscCurrency] = useState<"BNB" | "USDT">("BNB");
  const [solanaCurrency, setSolanaCurrency] = useState<"SOL" | "USDT">("SOL");
  const refer = useReferralHandling();
  // Access appkit hooks for wallet connection
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { isConnected, address } = useAppKitAccount();
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const lmxPriceUsd = 0.014; // Example LMX price in USD, replace with actual data

  // Get presale functionality from the usePresale hook

  // Handle wallet connection status
  const hasWalletConnected = isConnected && address;

  // Set currency symbol based on selected network and currency
  const currencySymbol = network === "bsc" ? bscCurrency : solanaCurrency;
  const [needsUsdtApproval, setNeedsUsdtApproval] = useState<boolean>(false);
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

  // Use the appropriate hook based on selected network
  const {
    buyTokens: buyBscTokens,
    isLoading: isBscBuying,
    // Add these properties if they exist in the BSC hook, otherwise will be undefined
    isModalOpen: isBscModalOpen = false,
    closeModal: closeBscModal = () => {},
    transactionStatus: bscTransactionStatus = {
      steps: [],
      currentStepId: null,
      isComplete: false,
      isError: false,
    },
    transactionSignature: bscTransactionSignature = null,
  } = useBscPresale(tokenAmount, "");

  // Use BSC USDT hook if BSC currency is USDT
  const {
    buyTokens: buyBscUsdtTokens,
    approveUsdtSpending,
    isUsdtApproved,
    isApprovalMode,
    approvalCompleted,
    isLoading: isBscUsdtBuying,
    isModalOpen: isBscUsdtModalOpen = false,
    closeModal: closeBscUsdtModal = () => {},
    transactionStatus: bscUsdtTransactionStatus = {
      steps: [],
      currentStepId: null,
      isComplete: false,
      isError: false,
    },
    transactionSignature: bscUsdtTransactionSignature = null,
  } = useBscUsdtPresale(tokenAmount, "");

  const {
    buyTokens: buySolTokens,
    isLoading: isSolBuying,
    isModalOpen: isSolModalOpen = false,
    closeModal: closeSolModal = () => {},
    transactionStatus: solTransactionStatus = {
      steps: [],
      currentStepId: null,
      isComplete: false,
      isError: false,
    },
    transactionSignature: solTransactionSignature = null,
  } = useSolanaPresale(tokenAmount, "");

  const {
    buyTokens: buySolUsdtTokens,
    isLoading: isSolUsdtBuying,
    isModalOpen: isSolUsdtModalOpen = false,
    closeModal: closeSolUsdtModal = () => {},
    transactionStatus: solUsdtTransactionStatus = {
      steps: [],
      currentStepId: null,
      isComplete: false,
      isError: false,
    },
    transactionSignature: solUsdtTransactionSignature = null,
  } = useSolanaUsdtPresale(tokenAmount, "");
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      if (network === "bsc" && bscCurrency === "USDT" && hasWalletConnected) {
        const approved = await isUsdtApproved();
        setNeedsUsdtApproval(!approved);
      }
    };

    checkApprovalNeeded();
  }, [network, bscCurrency, tokenAmount, hasWalletConnected, isUsdtApproved]);

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

  // Use the appropriate values based on selected network and currency
  const isLoading =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? isBscBuying
        : isBscUsdtBuying
      : solanaCurrency === "SOL"
        ? isSolBuying
        : isSolUsdtBuying;

  const isModalOpen =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? isBscModalOpen
        : isBscUsdtModalOpen
      : solanaCurrency === "SOL"
        ? isSolModalOpen
        : isSolUsdtModalOpen;

  const closeModal =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? closeBscModal
        : closeBscUsdtModal
      : solanaCurrency === "SOL"
        ? closeSolModal
        : closeSolUsdtModal;

  const transactionStatus =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? bscTransactionStatus
        : bscUsdtTransactionStatus
      : solanaCurrency === "SOL"
        ? solTransactionStatus
        : solUsdtTransactionStatus;

  const transactionSignature =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? bscTransactionSignature
        : bscUsdtTransactionSignature
      : solanaCurrency === "SOL"
        ? solTransactionSignature
        : solUsdtTransactionSignature;

  // Make sure token amount is updated if LMX price changes
  useEffect(() => {
    if (usdAmount > 0 && lmxPriceUsd > 0) {
      // Update token amount when LMX price changes
      const newTokenAmount = usdAmount / lmxPriceUsd;
      setTokenAmount(newTokenAmount);
    }
  }, [lmxPriceUsd, usdAmount]);

  // Handle USD amount change with validation
  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isLoadingBalances) {
      refreshBalances();
    }
    if (value < 0) {
      setUsdAmount(0);
      setTokenAmount(0);
      setCryptoAmount(0);
      return;
    }

    setUsdAmount(value);
    updateAmounts(value);
  };

  const {
    solBalance,
    usdtBalance,
    bnbBalance,
    bscUsdtBalance,
    isLoadingBalances,
    refreshBalances,
  } = useWalletBalances();
  // Handle purchase
  const handleBuy = async () => {
    console.log("Buying tokens...");

    // Validate wallet connection based on selected network
    if (!hasWalletConnected) {
      console.log(`Please connect your ${network.toUpperCase()} wallet first`);
      toast.error(`Please connect your ${network.toUpperCase()} wallet first`);
      return;
    }

    if (usdAmount < MIN_BUY) {
      console.log(`Minimum purchase amount is $${MIN_BUY} USD`);
      toast.error(`Minimum purchase amount is $${MIN_BUY.toFixed(2)} USD`);
      return;
    }

    const currentBalance =
      network === "bsc"
        ? bscCurrency === "BNB"
          ? bnbBalance
          : bscUsdtBalance
        : solanaCurrency === "SOL"
          ? solBalance
          : usdtBalance;
    // Check if the user has enough balance for the purchase
    if (currentBalance !== null) {
      if (cryptoAmount > currentBalance) {
        toast.error(
          `Insufficient ${currencySymbol} balance. You have ${currentBalance.toFixed(
            currencySymbol === "SOL"
              ? 4
              : currencySymbol === "USDT"
                ? 2
                : currencySymbol === "BNB"
                  ? 4
                  : 2
          )} ${currencySymbol} but need ${cryptoAmount.toFixed(
            currencySymbol === "SOL"
              ? 4
              : currencySymbol === "USDT"
                ? 2
                : currencySymbol === "BNB"
                  ? 4
                  : 2
          )} ${currencySymbol}.`
        );
        return;
      }
    }
    console.log(network, bscCurrency, solanaCurrency);
    try {
      // Execute purchase based on selected network and currency
      if (network === "bsc") {
        if (bscCurrency === "BNB") {
          await buyBscTokens();
        } else {
          // For BSC USDT, check if approval is needed first
          const approved = await isUsdtApproved();
          if (!approved) {
            toast.info("USDT approval required before purchase");
            await approveUsdtSpending();
            return; // Stop here, user needs to click Buy again after approval
          }

          // If we got here, USDT is approved and we can proceed with purchase
          await buyBscUsdtTokens();
        }
      } else {
        // For Solana, use the appropriate purchase method based on currency
        if (solanaCurrency === "SOL") {
          await buySolTokens();
        } else {
          await buySolUsdtTokens();
        }
      }
    } catch (error) {
      console.error("Error buying tokens:", error);
      toast.error("Failed to purchase tokens");
    }
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
        <h2 className="text-2xl font-semibold text-white">Buy LMX Tokens</h2>
        <div className="flex justify-between items-center mb-6 mt-2">
          <div className="flex flex-col items-left gap-3">
            {/* Network selector with icons */}
            <div className="bg-black/30 rounded-sm p-1 border border-primary/20">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNetworkChange("bsc")}
                  className={`px-3 py-1 rounded-sm text-sm transition-colors flex items-center gap-1 ${
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
                  className={`px-3 py-1 rounded-sm text-sm transition-colors flex items-center gap-1 ${
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
              <div className="flex items-left gap-1 px-3 py-1 ">
                {network === "solana" ? (
                  // Solana currency options
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSolanaCurrency("SOL")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${
                        solanaCurrency === "SOL"
                          ? "bg-primary/30"
                          : "bg-black/20 opacity-70"
                      }`}
                    >
                      <Image
                        src={CURRENCY_ICONS.SOL}
                        alt="SOL"
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span>SOL</span>
                    </button>
                    <button
                      onClick={() => setSolanaCurrency("USDT")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${
                        solanaCurrency === "USDT"
                          ? "bg-primary/30"
                          : "bg-black/20 opacity-70"
                      }`}
                    >
                      <Image
                        src={CURRENCY_ICONS.USDT}
                        alt="USDT"
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span>USDT</span>
                    </button>
                  </div>
                ) : (
                  // BSC currency options
                  <div className="flex gap-1 w-1/2">
                    {/* BNB option (disabled/commented out)
                    <button
                      onClick={() => setBscCurrency("BNB")}
                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${
                        bscCurrency === "BNB" ? "bg-primary/30" : "bg-black/20 opacity-70"
                      }`}
                    >
                      <Image
                        src={CURRENCY_ICONS.BNB}
                        alt="BNB"
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span>BNB</span>
                    </button>
                    */}
                    <button
                      onClick={() => setBscCurrency("USDT")}
                      className={`flex  items-center gap-1 px-2 py-1 rounded-sm text-xs bg-primary/30`}
                    >
                      <Image
                        src={CURRENCY_ICONS.USDT}
                        alt="USDT"
                        width={16}
                        height={16}
                        className="rounded-full"
                      />
                      <span>USDT</span>
                    </button>
                  </div>
                )}
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
                  Buy ${tokenAmount.toFixed(2)} LMX
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
        <TransactionStatusModal
          isOpen={isModalOpen}
          onClose={closeModal}
          status={transactionStatus}
          title={`${network.toUpperCase()} Transaction Status`}
          transactionSignature={transactionSignature || undefined}
          network={network}
        />
      </div>
    </div>
  );
}

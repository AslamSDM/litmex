"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ArrowRight,
  Wallet,
  RefreshCcw,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import usePresale from "@/components/hooks/usePresale";
import GlowButton from "@/components/GlowButton";
import { toast } from "sonner";
import { useBscPresale } from "./hooks/useBscPresale";
import { useBscUsdtPresale } from "./hooks/useBscUsdtPresale";
import { useSolanaPresale } from "./hooks/useSolanaPresale";
import { useSolanaUsdtPresale } from "./hooks/useSolanaUsdtPresale";
import { useWalletBalances } from "./hooks/useWalletBalances";
import TransactionStatusModal from "./TransactionStatusModal";
import { PendingTransactions } from "./PendingTransactions";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { solana, bsc } from "@reown/appkit/networks";
import { useSession } from "next-auth/react";
import { modal } from "@/components/providers/wallet-provider";
import useReferralHandling from "./hooks/useReferralHandling";
import { MIN_BUY, NETWORK_ICONS, CURRENCY_ICONS } from "@/lib/constants";
import Image from "next/image";
import { UnifiedWalletButton } from "./UnifiedWalletButton";

// Extended type for our session with referredBy field

interface CustomSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  walletAddress?: string | null;
  solanaAddress?: string | null;
  evmAddress?: string | null;
  referralCode?: string | null;
  referredBy?: string | null;
}

interface PresaleBuyFormProps {
  referralCode?: string;
  className?: string;
  prices?: {
    bnb: number | undefined;
    sol: number | undefined;
  };
}

const PresaleBuyForm: React.FC<PresaleBuyFormProps> = ({
  referralCode,
  className = "",
  prices = { bnb: 600, sol: 1500 }, // Default prices if not provided
}) => {
  // State

  const [usdAmount, setUsdAmount] = useState<number>(500);
  const [tokenAmount, setTokenAmount] = useState<number>(35714.2857142857); // Derived from USD amount
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { isConnected, address } = useAppKitAccount();
  const { data: session } = useSession();
  const user = session?.user as CustomSessionUser | undefined;
  const referralInfo = useReferralHandling();

  const [network, setNetwork] = useState<"bsc" | "solana">("bsc");
  const [solanaCurrency, setSolanaCurrency] = useState<"SOL" | "USDT">("SOL");
  const [showSolanaVerificationModal, setShowSolanaVerificationModal] =
    useState(false);
  const [showBSCVerificationModal, setShowBSCVerificationModal] =
    useState(false);
  const [needsUsdtApproval, setNeedsUsdtApproval] = useState(false);

  useEffect(() => {
    // Switch network based on CAIP network
    if (chainId === "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") {
      setNetwork("solana");
    } else {
      setNetwork("bsc");
    }
  }, [chainId]);

  // Reset to default SOL currency when network changes to Solana
  useEffect(() => {
    if (network === "solana") {
      setSolanaCurrency("SOL");
    }
  }, [network]);

  // Get all presale functionality from the usePresale hook
  const { cryptoPrices, isLoadingPrices, loadCryptoPrices, lmxPriceUsd } =
    usePresale();

  // Handle session updates after wallet verification
  useEffect(() => {
    // Check if wallet has been verified after a modal was shown
    if (
      network === "solana" &&
      user?.solanaAddress &&
      showSolanaVerificationModal
    ) {
      setShowSolanaVerificationModal(false);
      toast.success("Solana wallet successfully verified!");
    }

    if (network === "bsc" && user?.evmAddress && showBSCVerificationModal) {
      setShowBSCVerificationModal(false);
      toast.success("BSC wallet successfully verified!");
    }
  }, [
    user?.solanaAddress,
    user?.evmAddress,
    network,
    showSolanaVerificationModal,
    showBSCVerificationModal,
  ]);

  const presaleStatus = true;

  // Define currency type for BSC
  const [bscCurrency, setBscCurrency] = useState<"BNB" | "USDT">("USDT");

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
    // approveUsdtSpending,
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

  // Wallet connection status
  const hasWalletConnected = isConnected && address;

  // Add an effect to check if USDT approval is needed whenever amount changes
  useEffect(() => {
    const checkApprovalNeeded = async () => {
      if (network === "bsc" && bscCurrency === "USDT" && hasWalletConnected) {
        const approved = await isUsdtApproved();
        setNeedsUsdtApproval(!approved);
      }
    };

    checkApprovalNeeded();
  }, [network, bscCurrency, tokenAmount, hasWalletConnected, isUsdtApproved]);

  // Get wallet balances
  const {
    solBalance,
    usdtBalance,
    bnbBalance,
    bscUsdtBalance,
    isLoadingBalances,
    refreshBalances,
  } = useWalletBalances();

  // Set currency symbol based on selected network and currency
  const currencySymbol = network === "bsc" ? bscCurrency : solanaCurrency;

  // Get current balance based on network and currency
  const currentBalance =
    network === "bsc"
      ? bscCurrency === "BNB"
        ? bnbBalance
        : bscUsdtBalance
      : solanaCurrency === "SOL"
        ? solBalance
        : usdtBalance;

  // Refresh balances when network or currency changes
  useEffect(() => {
    if (hasWalletConnected) {
      refreshBalances();
    }
  }, [solanaCurrency, bscCurrency, refreshBalances, hasWalletConnected]);

  // Handle network switch
  const handleNetworkChange = (newNetwork: "bsc" | "solana") => {
    switchNetwork(newNetwork === "bsc" ? bsc : solana);
    setNetwork(newNetwork);
  };

  // Handle wallet verification based on current network
  const handleVerifyWallet = () => {
    // First connect wallet if needed, otherwise show relevant verification prompt
    if (!hasWalletConnected) {
      modal.open();
    } else {
      // Using toast to inform user what they need to do
      if (network === "bsc" && !user?.evmAddress) {
        toast.info("Please verify your BSC wallet to continue with purchase");
        // Clear any skip flags
        localStorage.removeItem("skipBSCWalletPrompt");
        // Show BSC verification modal
        setShowBSCVerificationModal(true);
      } else if (network === "solana" && !user?.solanaAddress) {
        toast.info(
          "Please verify your Solana wallet to continue with purchase"
        );
        // Clear any skip flags
        localStorage.removeItem("skipWalletPrompt");
        // Show Solana verification modal
        setShowSolanaVerificationModal(true);
      }
    }
  };

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
    // Update token and crypto amounts when USD amount changes

    if (usdAmount > 0 && cryptoPrices && lmxPriceUsd) {
      updateAmounts(usdAmount);
    }
  }, [
    network,
    cryptoPrices,
    updateAmounts,
    bscCurrency,
    usdAmount,
    lmxPriceUsd,
  ]);

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

    if (value < 0) {
      setUsdAmount(0);
      setTokenAmount(0);
      setCryptoAmount(0);
      return;
    }

    setUsdAmount(value);
    updateAmounts(value);
  };

  // Handle purchase
  const handleBuy = async () => {
    // Temp Error
    toast.error("Some Error Occurred");
    return;

    // Validate presale status

    if (!presaleStatus) {
      toast.error("Presale is not active");
      return;
    }

    // Validate wallet connection based on selected network
    if (!hasWalletConnected) {
      toast.error(`Please connect your ${network.toUpperCase()} wallet first`);
      return;
    }

    if (usdAmount < MIN_BUY) {
      toast.error(`Minimum purchase amount is $${MIN_BUY.toFixed(2)} USD`);
      return;
    }
    const currentBalance = 0;

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

    try {
      // Execute purchase based on selected network and currency
      if (network === "bsc") {
        if (bscCurrency === "BNB") {
          await buyBscTokens();
        } else {
          // For BSC USDT, check if approval is needed first
          const approved = await isUsdtApproved();
          // if (!approved) {
          //   toast.info("USDT approval required before purchase");
          //   await approveUsdtSpending();
          //   return; // Stop here, user needs to click Buy again after approval
          // }

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
  const refreshPrices = async () => {
    toast.info("Refreshing cryptocurrency prices...");
    await loadCryptoPrices(false, {
      bnb: prices.bnb || 600,
      sol: prices.sol || 150,
    });
    toast.success("Cryptocurrency prices updated");
  };

  return (
    <div
      className={`bg-black/30 backdrop-blur-md rounded-xl p-6 border border-primary/10 ${className}`}
    >
      {/* Header */}{" "}
      <h2 className="text-2xl font-semibold text-white">Buy LMX Tokens</h2>
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col items-left gap-3">
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

          {/* Currency selector with both options visible for Solana */}
          {network === "solana" ? (
            <div className="bg-black/30 rounded-md p-1 border border-primary/20">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSolanaCurrency("SOL")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    solanaCurrency === "SOL"
                      ? "bg-primary/30 text-white"
                      : "text-white/70 hover:text-white"
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
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    solanaCurrency === "USDT"
                      ? "bg-primary/30 text-white"
                      : "text-white/70 hover:text-white"
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
            </div>
          ) : (
            <div className="flex w-1/2 gap-1 px-3 py-1 bg-black/30 rounded-md border border-primary/20 text-sm text-white">
              <Image
                src={CURRENCY_ICONS.USDT}
                alt="USDT"
                width={16}
                height={16}
                className="rounded-full"
              />
              <span>USDT</span>
            </div>
          )}

          {/* Dropdown menu for currency selection */}
          {/* We can implement a full dropdown later if needed */}
        </div>

        <button
          onClick={refreshPrices}
          className="text-primary hover:text-primary/80 transition-colors"
          title="Refresh cryptocurrency prices"
          disabled={isLoadingPrices}
        >
          {isLoadingPrices ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCcw className="h-5 w-5" />
          )}
        </button>
      </div>
      {/* Loading state */}
      {isLoadingPrices && !cryptoPrices ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-primary/70 text-center">Loading price data...</p>
        </div>
      ) : (
        <>
          {/* Current Price Information */}
          <div className="mb-6 p-3 bg-black/40 rounded-lg border border-primary/10 flex justify-between items-center">
            <div className="mr-1">
              <div className="text-sm font-medium text-white/80 mb-2 text-cente">
                Token Price Information:
              </div>
              <div className="flex justify-between items-center mb-3 text-cente">
                <div className="flex items-center">
                  <span className="text-green-400 font-bold">
                    $ {lmxPriceUsd.toFixed(3)} per LMX
                  </span>
                </div>
              </div>
              {/* <span className="text-xs text-white/60">Fixed USD Price</span> */}
            </div>
          </div>

          {/* Purchase Form */}
          {presaleStatus && (
            <>
              {/* USD Amount Input */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="usdAmount" className="text-sm text-white/70">
                    Amount in USD
                  </Label>

                  {/* Wallet Balance Display */}
                  {hasWalletConnected && (
                    <div className="flex items-center text-xs text-white/70">
                      <Wallet className="h-3 w-3 mr-1" />
                      Balance:{" "}
                      {isLoadingBalances ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <span className="font-medium text-primary/90">
                          {currentBalance !== null
                            ? `${currentBalance.toFixed(
                                currencySymbol === "SOL"
                                  ? 4
                                  : currencySymbol === "BNB"
                                    ? 4
                                    : 2
                              )} ${currencySymbol}`
                            : "Unknown"}
                        </span>
                      )}
                      <button
                        onClick={refreshBalances}
                        className="ml-1 text-primary/60 hover:text-primary/90"
                        title="Refresh balance"
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </button>
                    </div>
                  )}
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
                  />
                  <div className="bg-black/40 px-3 py-2 rounded-md text-white/80">
                    USD
                  </div>

                  {/* Max Button */}
                  {hasWalletConnected &&
                    currentBalance !== null &&
                    currentBalance > 0 && (
                      <button
                        onClick={() => {
                          // Calculate max USD based on available balance
                          if (network === "solana") {
                            if (
                              solanaCurrency === "SOL" &&
                              solBalance !== null
                            ) {
                              const maxUsd =
                                solBalance * (cryptoPrices?.sol || 0);
                              setUsdAmount(Math.max(0.1, maxUsd * 0.95)); // Leave 5% for gas fees
                              updateAmounts(Math.max(0.1, maxUsd * 0.95));
                            } else if (
                              solanaCurrency === "USDT" &&
                              usdtBalance !== null
                            ) {
                              setUsdAmount(usdtBalance * 0.99); // Leave 1% for gas fees
                              updateAmounts(usdtBalance * 0.99);
                            }
                          } else {
                            // BSC network
                            if (bscCurrency === "BNB" && bnbBalance !== null) {
                              const maxUsd =
                                bnbBalance * (cryptoPrices?.bnb || 0);
                              setUsdAmount(Math.max(0.1, maxUsd * 0.95)); // Leave 5% for gas fees
                              updateAmounts(Math.max(0.1, maxUsd * 0.95));
                            } else if (
                              bscCurrency === "USDT" &&
                              bscUsdtBalance !== null
                            ) {
                              setUsdAmount(bscUsdtBalance * 0.99); // Leave 1% for gas fees
                              updateAmounts(bscUsdtBalance * 0.99);
                            }
                          }
                        }}
                        className="px-2 py-1 bg-primary/20 rounded-md text-xs font-medium text-white hover:bg-primary/30 transition-colors"
                        title="Use maximum available balance"
                      >
                        MAX
                      </button>
                    )}
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
                  {/* Balance Indicator */}
                  {currentBalance !== null && hasWalletConnected && (
                    <span
                      className={`ml-2 ${
                        cryptoAmount > currentBalance
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                      title={
                        cryptoAmount > currentBalance
                          ? "Insufficient balance"
                          : "Sufficient balance"
                      }
                    >
                      {cryptoAmount > currentBalance ? (
                        "(Insufficient)"
                      ) : (
                        <BadgeCheck className="inline h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Referral Code Display (read-only) */}
              <div className="mb-6">
                {/* Debug info (remove in production) */}
                {process.env.NODE_ENV !== "production" && (
                  <div className="mt-1 text-xs text-primary/50">
                    {user?.referredBy
                      ? `Session referral: ${user?.referredBy}`
                      : ""}
                  </div>
                )}
              </div>

              {/* Buy/Approve Button */}
              <div className="mb-4">
                {!hasWalletConnected ? (
                  <UnifiedWalletButton className="w-full py-3" />
                ) : network === "bsc" && bscCurrency === "USDT" ? (
                  // Special handling for USDT on BSC to show approval button when needed
                  <div>
                    <GlowButton
                      onClick={handleBuy}
                      disabled={isLoading || !presaleStatus || usdAmount <= 0}
                      className="w-full py-3 bg-gradient-to-br from-indigo-600/90 to-violet-700 hover:from-indigo-600 hover:to-violet-600 border-indigo-400/30 text-white font-medium transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>
                            {isApprovalMode
                              ? "Approving USDT..."
                              : "Processing Purchase..."}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>
                            {needsUsdtApproval ? (
                              <>Approve {usdAmount} USDT</>
                            ) : (
                              <>
                                Buy
                                {isNaN(usdAmount)
                                  ? "0.00"
                                  : usdAmount.toFixed(2)}{" "}
                                worth of LMX (
                                {isNaN(tokenAmount)
                                  ? "0.00"
                                  : tokenAmount.toFixed(2)}{" "}
                                LMX)
                              </>
                            )}
                          </span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </GlowButton>

                    {/* Show approval info for USDT flow */}
                    {!isLoading && (
                      <div className="mt-2 text-xs text-center text-white/70">
                        {needsUsdtApproval
                          ? "First approve USDT spending, then you'll be able to complete the purchase"
                          : "USDT spending already approved. You can buy tokens now."}
                      </div>
                    )}
                  </div>
                ) : (
                  // Standard button for other currencies
                  <GlowButton
                    onClick={handleBuy}
                    disabled={isLoading || !presaleStatus || usdAmount <= 0}
                    className="w-full py-3 bg-gradient-to-br from-indigo-600/90 to-violet-700 hover:from-indigo-600 hover:to-violet-600 border-indigo-400/30 text-white font-medium transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Processing Transaction...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>
                          Buy
                          {isNaN(usdAmount)
                            ? "0.00"
                            : usdAmount.toFixed(2)}{" "}
                          worth of LMX (
                          {isNaN(tokenAmount) ? "0.00" : tokenAmount.toFixed(2)}{" "}
                          LMX)
                        </span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </GlowButton>
                )}

                {/* Wallet status indicators */}
                <div
                  className={`mt-2 text-sm text-center ${
                    hasWalletConnected ? "text-green-400" : "text-amber-400"
                  }`}
                >
                  {hasWalletConnected ? (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                      {network.toUpperCase()} Wallet Connected
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mr-2"></div>
                      {network.toUpperCase()} Wallet Not Connected
                    </div>
                  )}
                </div>
              </div>

              {/* Presale Progress */}
            </>
          )}

          {/* Show pending transactions */}
          <PendingTransactions />
        </>
      )}
      {/* Transaction Status Modal for both BSC and Solana transactions */}
      <TransactionStatusModal
        isOpen={isModalOpen}
        onClose={closeModal}
        status={transactionStatus}
        title={`${network.toUpperCase()} Transaction Status`}
        transactionSignature={transactionSignature || undefined}
        network={network}
      />
    </div>
  );
};

export default PresaleBuyForm;

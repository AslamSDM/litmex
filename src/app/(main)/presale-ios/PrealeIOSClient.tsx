"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppKitNetwork, useAppKitAccount } from "@reown/appkit/react";
import { solana, bsc } from "@reown/appkit/networks";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBscUsdtPresale } from "@/components/hooks/useBscUsdtPresale";
import { useSolanaPresale } from "@/components/hooks/useSolanaPresale";
import { useSolanaUsdtPresale } from "@/components/hooks/useSolanaUsdtPresale";
import { useBscPresale } from "@/components/hooks/useBscPresale";
import { useWalletBalances } from "@/components/hooks/useWalletBalances";
import { LMX_PRICE, MIN_BUY } from "@/lib/constants";
import TransactionStatusModal from "@/components/TransactionStatusModal";
import useReferralHandling, {
  useReferralStore,
} from "@/components/hooks/useReferralHandling";
import { Button } from "@/components/ui/button";
import { UnifiedWalletButton } from "@/components/UnifiedWalletButton";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import { Footer } from "@/components/Footer";
import ReferralSystem from "@/components/ReferralLevel";
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
  const [bscCurrency, setBscCurrency] = useState<"BNB" | "USDT">("USDT");
  const [solanaCurrency, setSolanaCurrency] = useState<"SOL" | "USDT">("SOL");
  const refer = useReferralHandling();
  const { setReferralCode } = useReferralStore();
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

  const lmxPriceUsd = LMX_PRICE; // Example LMX price in USD, replace with actual data

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
      setBscCurrency("USDT");
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
  //   const refreshPrices = async () => {
  //     toast.info("Refreshing cryptocurrency prices...");
  //     await loadCryptoPrices(false);
  //     toast.success("Cryptocurrency prices updated");
  //   };

  return (
    <div className="relative min-h-screen">
      <FlickeringGrid
        className="absolute inset-0 z-0 size-full"
        squareSize={4}
        gridGap={6}
        color="#7001a5"
        maxOpacity={0.5}
        flickerChance={0.1}
        height={2000}
        width={400}
      />
      <div className="relative z-10">
        <header className="flex justify-between items-center shadow-sm mt-4 px-4">
          <div className="flex items-center">
            <img src="/lit_logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto text-red-400 hover:bg-red-500/10"
            onClick={() => {
              // Add your logout logic here
              signOut({ callbackUrl: "/" }); // Redirect to home after logout
              setReferralCode("");
            }}
          >
            <LogOut size={16} />
          </Button>
        </header>
        <div className="container mx-auto py-12 px-4 md:px-8 min-h-screen  overflow-hidden">
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-center ">
            <span className="text-primary">LITMEX Token Presale</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg md:text-xl text-center max-w-3xl mx-auto mt-4">
            Litmex Presale is now live Building Gamblifi for autonomous onchain
            AI gambling . Join early as we reshape betting
          </p>
          <div className="w-full max-w-md bg-black/30 backdrop-blur-md rounded-xl p-6 border border-primary/10">
            {/* Header */}
            <h2 className="text-2xl font-semibold text-white">
              Buy LMX Tokens
            </h2>
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
                <p className="text-primary/70 text-center">
                  Loading price data...
                </p>
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
                    <span className="text-xs text-white/60">
                      Fixed USD Price
                    </span>
                  </div>
                </div>

                {/* USD Amount Input */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label
                      htmlFor="usdAmount"
                      className="text-sm text-white/70"
                    >
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
                    <UnifiedWalletButton className="w-full py-3" />
                  ) : (
                    <button
                      onClick={handleBuy}
                      disabled={usdAmount < MIN_BUY}
                      className="w-full py-3 bg-gradient-to-br from-indigo-600/90 to-violet-700 hover:from-indigo-600 hover:to-violet-600 border-indigo-400/30 text-white font-medium transition-all duration-200 rounded-md"
                    >
                      Buy {tokenAmount.toFixed(2)} LMX
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
            <div className="p-6 md:p-8 mt-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-black/80 relative overflow-hidden">
              {/* Background image with overlay */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/logos/trumpimage.webp"
                  alt="President Trump"
                  fill
                  className="object-cover opacity-25"
                  priority
                />
                {/* <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-amber-900/20 to-black/20 z-1"></div> */}
              </div>

              <div className="relative z-10 ">
                <h3 className="text-lg sm:text-xl font-bold text-amber-400 mb-4 flex items-center">
                  Trump Token Referral Rewards
                </h3>
              </div>

              <div className="flex items-center justify-center mb-6 mt-[150px]">
                <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-amber-400/20 p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center w-64">
                  <span className="text-amber-400 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                    10%
                  </span>
                  <span className="text-sm sm:text-base md:text-lg text-amber-300/80">
                    REFERRAL BONUS
                  </span>
                </div>
              </div>

              <div className="text-left">
                {/* <p className="text-sm sm:text-base text-gray-300 mb-3">
                                  Direct referrers will receive{" "}
                                  <span className="text-amber-400 font-medium">
                                    10% Trump Tokens
                                  </span>{" "}
                                  in Solana immediately upon successful referral purchase.
                                  World Liberty Finance Treasury rewards your patriotism.
                                </p> */}

                <div className="flex items-center text-xs sm:text-sm bg-amber-500/10 p-3 rounded mb-3">
                  <span className="text-amber-300">
                    💰 Rewards immediately transferred to your Solana wallet
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
                  <span className="text-gray-300">Referral Limit</span>
                  <span className="text-amber-400 font-medium">Unlimited</span>
                </div>
              </div>
            </div>
            <div className="mt-12 mb-8">
              <ReferralSystem />
            </div>
            <div className="mt-12">
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-4 flex items-center">
                Road map
              </h3>
              <RoadmapTimeline />
            </div>
            <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-primary mb-4 flex items-center">
                Backed by Industry Leaders{" "}
              </h3>
              <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                <Image
                  src="/logos/a16zcrypto_Logo.svg"
                  alt="a16z Crypto"
                  width={160}
                  height={80}
                  className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                />
              </div>
              <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                <Image
                  src="/logos/paradigm-logo-removebg-preview.png"
                  alt="Paradigm"
                  width={160}
                  height={80}
                  className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                />
              </div>
              <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                <Image
                  src="/logos/animoca-removebg-preview.png"
                  alt="Animoca Brands"
                  width={160}
                  height={80}
                  className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                />
              </div>
              <div className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[160px] h-[60px] sm:h-[70px] md:h-[80px] flex items-center justify-center">
                <Image
                  src="/logos/dragonfly-removebg-preview.png"
                  alt="Dragonfly Capital"
                  width={160}
                  height={80}
                  className="max-h-[60px] sm:max-h-[70px] md:max-h-[80px] max-w-full object-contain filter brightness-0 invert"
                />
              </div>
            </div>

            {/* Footer Section */}
            <div className="mt-12 pt-8 border-t ">
              <div className="text-center mb-8">
                <h3 className="text-white text-lg font-medium mb-4">
                  Resources
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://github.com/Litmexprotocol/Litmex-Whitepaper/blob/main/LItmex%20Protocol%20Whitepaper.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-primary transition-colors text-sm"
                    >
                      📄 Whitepaper
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.cyberscope.io/audits/lmx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-primary transition-colors text-sm"
                    >
                      🔍 Audit
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/cyberscope-io/audits/blob/main/lmx/audit.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-primary transition-colors text-sm"
                    >
                      📋 Audit Report
                    </a>
                  </li>
                </ul>
              </div>

              <div className="text-center text-xs text-white/50 pb-8">
                <p>&copy; 2025 Litmex Protocol. All rights reserved.</p>
              </div>
            </div>

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
      </div>
    </div>
  );
}

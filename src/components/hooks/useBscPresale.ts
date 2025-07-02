import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { presaleAbi } from "@/lib/abi";
import { parseEther } from "viem";
import {
  fetchCryptoPrices,
  calculateCryptoCost,
  LMX_PRICE_USD,
} from "@/lib/price-utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useTransactionStatus, TransactionStep } from "./useTransactionStatus";
import { BSC_PRESALE_CONTRACT_ADDRESS } from "@/lib/constants";
import { set } from "zod";

// API endpoint for recording purchases in the database

// Initial transaction steps for BSC
const initialTransactionSteps: TransactionStep[] = [
  {
    id: "wallet-connect",
    title: "Connect Wallet",
    description: "Connect to your BSC wallet",
    status: "pending",
  },
  {
    id: "prepare-transaction",
    title: "Prepare Transaction",
    description: "Calculate token amount and prepare transaction",
    status: "pending",
  },
  {
    id: "send-transaction",
    title: "Send Transaction",
    description: "Sign and send transaction to the BSC network",
    status: "pending",
  },
  {
    id: "verify-transaction",
    title: "Confirm Transaction",
    description: "Wait for blockchain confirmation",
    status: "pending",
  },
  {
    id: "save-allocation",
    title: "Record Purchase",
    description: "Record your token allocation in our database",
    status: "pending",
  },
];

export function useBscPresale(tokenAmount: number, referrer?: string) {
  const [dynamicCost, setDynamicCost] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const { address } = useAccount();

  // Initialize transaction status
  const {
    status,
    setCurrentStep,
    currentStep,
    nextStep,
    completeTransaction,
    setError,
    resetStatus,
  } = useTransactionStatus(initialTransactionSteps);

  // Get token price from contract - keeping this for backward compatibility
  const { data: tokenPrice } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "tokenPrice",
  });

  const { data: presaleStatus } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "presaleActive",
  });
  const { data: userBalance } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: presaleAbi.abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  // Write contract hook for buying tokens
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: hash as `0x${string}`,
    });

  // Calculate cost in BNB using real-time price data
  useEffect(() => {
    const calculateDynamicCost = async () => {
      if (!tokenAmount) return;
      if (tokenAmount <= 0) return;

      setIsLoadingPrice(true);
      try {
        // Get the latest crypto prices
        const prices = await fetchCryptoPrices();
        setBnbPrice(prices.bnb);

        // Calculate cost in BNB based on token amount and fixed LMX price
        const bnbCost = calculateCryptoCost(tokenAmount, "bnb", prices);

        // Convert to Wei/Gwei format for contract
        setDynamicCost(parseEther(bnbCost.toString()));
      } catch (error) {
        console.error("Error calculating token cost:", error);
        // toast.error("Error calculating token cost, using fallback price");

        // Fallback to contract price if API fails
        if (tokenPrice) {
          setDynamicCost(
            parseEther((Number(tokenPrice) * tokenAmount).toString())
          );
        }
      } finally {
        setIsLoadingPrice(false);
      }
    };

    calculateDynamicCost();
  }, [tokenAmount, tokenPrice]);
  useEffect(() => {
    if (!hash) return;
    if (currentStep?.id !== "verify-transaction") return;
    if (isPending) return;
    if (hash) {
      setTransactionSignature(hash);
    } else {
      setError("verify-transaction", "No transaction hash returned");
      toast.error("Transaction sent but could not be verified");
      setIsLoading(false);
    }

    let attempts = 0;
    const maxAttempts = 30; // Maximum number of polling attempts
    const pollInterval = 5000; // Poll every 5 seconds
    let pollTimer: NodeJS.Timeout;

    async function verifyTransaction() {
      try {
        const verificationResponse = await fetch("/api/presale/verify-bsc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hash,
          }),
        });

        const responseData = await verificationResponse.json();

        if (responseData.status === "PENDING" && attempts < maxAttempts) {
          // Transaction is still pending, poll again after interval
          attempts++;
          console.log(
            `Transaction still pending. Polling attempt ${attempts}/${maxAttempts}`
          );
          pollTimer = setTimeout(verifyTransaction, pollInterval);
          return;
        }

        if (!verificationResponse.ok) {
          console.error("Transaction verification failed:", responseData);
          setError("verify-transaction", "Transaction verification failed");
          toast.error(
            "Transaction verification failed. Please contact support."
          );
          setIsLoading(false);
          return false;
        }

        // Transaction was successfully verified
        if (responseData.verified) {
          nextStep(); // Move to final step

          // Step 5: Save allocation in database
          setCurrentStep("save-allocation");
          nextStep(); // Move to next step
          completeTransaction(); // Mark transaction as complete
          toast.success(`Successfully purchased ${tokenAmount} LMX tokens!`);
          return true;
        } else if (responseData.status === "FAILED") {
          setError("verify-transaction", "Transaction failed on blockchain");
          toast.error("Transaction failed. Please try again.");
          setIsLoading(false);
          return false;
        }
      } catch (verificationError) {
        console.error("Error during verification:", verificationError);

        if (attempts < maxAttempts) {
          // Error during verification, try again
          attempts++;
          console.log(
            `Verification error. Retrying. Attempt ${attempts}/${maxAttempts}`
          );
          pollTimer = setTimeout(verifyTransaction, pollInterval);
          return;
        }

        setError("verify-transaction", "Transaction confirmation timed out");
        toast.warning(
          "Transaction sent but confirmation timed out. Check your wallet for status."
        );
        setIsLoading(false);
        return true; // Return true since tx was sent
      }
    }

    verifyTransaction();

    // Clean up timer when component unmounts
    return () => {
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [
    tokenAmount,
    currentStep,
    hash,
    completeTransaction,
    nextStep,
    setError,
    setCurrentStep,
    isPending,
  ]);

  // Function to set referrer - simplified implementation

  // Function to buy tokens
  const buyTokens = async (retryWithExplicitGas = false) => {
    setIsLoading(true);
    setTransactionSignature(null);
    resetStatus();
    setIsModalOpen(true);

    try {
      // Step 1: Validate token amount and connect wallet
      setCurrentStep("wallet-connect");

      if (tokenAmount <= 0) {
        setError("wallet-connect", "Token amount must be greater than 0");
        toast.error("Token amount must be greater than 0");
        setIsLoading(false);
        return false;
      }

      // Check if BSC wallet is connected
      if (!address) {
        setError("wallet-connect", "BSC wallet not connected");
        toast.error("BSC wallet not connected");
        setIsLoading(false);
        return false;
      }

      nextStep(); // Move to next step

      // Step 2: Prepare transaction
      setCurrentStep("prepare-transaction");

      // Set referrer if provided

      // Validate dynamic cost
      if (dynamicCost <= BigInt(0)) {
        setError("prepare-transaction", "Could not calculate token cost");
        toast.error("Could not calculate token cost, please try again");
        setIsLoading(false);
        return false;
      }

      nextStep(); // Move to next step

      // Step 3: Send Transaction
      setCurrentStep("send-transaction");

      console.log(
        `Buying ${tokenAmount} tokens for cost: ${dynamicCost} wei,  parseEther(tokenAmount): ${parseEther(
          tokenAmount.toString()
        )}`
      );

      // Prepare transaction parameters
      const txParams = {
        address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
        abi: presaleAbi.abi,
        functionName: "buyTokens",
        args: [parseEther(tokenAmount.toString())],
        value: dynamicCost,
        gas: BigInt(10000000),
      };

      try {
        // Send transaction
        console.log("Transaction parameters:", txParams);
        const hash = await writeContract(txParams);
        console.log("Transaction sent, hash:", hash);
      } catch (txError) {
        console.error("Transaction error:", txError);
        const errorMessage =
          typeof txError === "object" &&
          txError !== null &&
          "message" in txError
            ? (txError as { message: string }).message
            : String(txError);

        setError("send-transaction", errorMessage);
        toast.error("Failed to send transaction");
        setIsLoading(false);
        return false;
      }

      nextStep(); // Move to next step
      setCurrentStep("verify-transaction");

      // Complete transaction flow

      return true;
    } catch (dbError) {
      console.error("Database error:", dbError);
      setError("save-allocation", "Failed to record purchase in database");
      toast.warning(
        "Transaction completed on blockchain, but failed to save in our records. Please contact support."
      );
      setIsLoading(false);
      return true; // Return true because the blockchain tx succeeded
    }
  };

  // Close modal function
  const closeModal = () => {
    setIsModalOpen(false);
    setIsLoading(false);
  };

  return {
    buyTokens,
    isLoading: isPending || isLoadingPrice || isConfirming || isLoading,
    bnbPrice,
    lmxPriceUsd: LMX_PRICE_USD,
    transactionStatus: status,
    isModalOpen,
    closeModal,
    transactionSignature,
    presaleStatus,
    userBalance: userBalance ? Number(userBalance) : 0,
  };
}

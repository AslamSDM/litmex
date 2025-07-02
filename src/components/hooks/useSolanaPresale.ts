import { useState } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "sonner";
import { solanaPresale } from "@/lib/presale-contract";
import {
  LMX_PRICE_USD,
  fetchCryptoPrices,
  calculateCryptoCost,
} from "@/lib/price-utils";
import { useAccount } from "wagmi";
import { useTransactionStatus, TransactionStep } from "./useTransactionStatus";
import { useAppKitProvider } from "@reown/appkit/react";
// API endpoint for recording purchases in the database
const API_ENDPOINT = "/api/presale/purchase";

// Master wallet address to receive SOL payments

// Initial transaction steps
const initialTransactionSteps: TransactionStep[] = [
  {
    id: "wallet-connect",
    title: "Connect Wallet",
    description: "Connect to your Solana wallet",
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
    description: "Sign and send transaction to the Solana network",
    status: "pending",
  },
  {
    id: "verify-transaction",
    title: "Verify Transaction",
    description: "Verify the transaction was successful",
    status: "pending",
  },
  {
    id: "save-allocation",
    title: "Record Purchase",
    description: "Record your token allocation in our database",
    status: "pending",
  },
];

export function useSolanaPresale(tokenAmount: number, referralCode?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const { address } = useAccount(); // Get user's wallet address

  // Initialize transaction status
  const {
    status,
    setCurrentStep,
    nextStep,
    completeTransaction,
    setError,
    resetStatus,
  } = useTransactionStatus(initialTransactionSteps);
  const { walletProvider } = useAppKitProvider<any>("solana");

  // Buy tokens with Solana
  const buyTokens = async () => {
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

      // Get SOL price from API
      const prices = await fetchCryptoPrices();
      setSolPrice(prices.sol);

      // Check if wallet is available in window (phantom, solflare, etc.)
      if (!window.solana) {
        setError("wallet-connect", "Solana wallet not detected");
        toast.error("Solana wallet not detected");
        setIsLoading(false);
        return false;
      }

      // Connect to wallet if needed
      if (!window.solana.isConnected) {
        try {
          await window.solana.connect();
        } catch (error) {
          setError("wallet-connect", "Failed to connect to Solana wallet");
          toast.error("Failed to connect to Solana wallet");
          setIsLoading(false);
          return false;
        }
      }

      const wallet = walletProvider;
      nextStep(); // Move to next step
      // Step 2: Prepare transaction
      setCurrentStep("prepare-transaction");

      // Calculate amount in SOL based on token amount and LMX price
      const solAmount = calculateCryptoCost(tokenAmount, "sol", prices);

      // Create Solana connection
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://mainnet.helius-rpc.com/?api-key=c84ddc95-f80a-480a-b8b0-7df6d2fcc62f" // Use Helius RPC or your preferred RPC endpoint
      );

      nextStep(); // Move to next step

      // Step 3: Send transaction
      setCurrentStep("send-transaction");

      // Send transaction using solanaPresale helper
      const success = await solanaPresale.buyTokens(
        connection,
        wallet,
        solAmount,
        referralCode
      );
      // const success = {
      //   signature:
      //     "GJTbiMRPGsunY4ANNPwEEfJxYFG9FLsjDpPNFX8qreQG5y7NZ3qTLr3tCn5vH9vSykR6vFgmkHQjjGJeNLDbZ94",
      // };

      if (!success) {
        setError("send-transaction", "Transaction failed or was rejected");
        toast.error("Transaction failed");
        setIsLoading(false);
        return false;
      }
      console.log(success);

      // Store the transaction signature for use in the UI
      const signature = success.signature;
      console.log("Transaction signature:", signature);

      // Wait for 2 seconds before continuing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setTransactionSignature(signature);

      nextStep(); // Move to next step

      // Step 4: Verify the transaction
      setCurrentStep("verify-transaction");

      // Define polling variables
      let attempts = 0;
      const maxAttempts = 30; // Maximum number of polling attempts
      const pollInterval = 5000; // Poll every 5 seconds

      // Function to verify transaction with polling
      const pollTransactionVerification = async (): Promise<boolean> => {
        try {
          const verificationResponse = await fetch(
            "/api/presale/verify-solana2",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                signature,
              }),
            }
          );

          const responseData = await verificationResponse.json();

          if (responseData.status === "PENDING" && attempts < maxAttempts) {
            // Transaction is still pending, poll again after interval
            attempts++;
            console.log(
              `Solana transaction still pending. Polling attempt ${attempts}/${maxAttempts}`
            );
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            return pollTransactionVerification(); // Recursively poll again
          }

          if (!verificationResponse.ok) {
            console.error(
              "Solana transaction verification failed:",
              responseData
            );
            setError("verify-transaction", "Transaction verification failed");
            toast.error(
              "Transaction verification failed. Please contact support."
            );
            setIsLoading(false);
            return false;
          }

          // Transaction was successfully verified
          if (responseData.verified) {
            console.log("Solana transaction verified successfully");
            nextStep(); // Move to next step
            return true;
          } else if (responseData.status === "FAILED") {
            setError(
              "verify-transaction",
              "Transaction failed on Solana blockchain"
            );
            toast.error("Transaction failed. Please try again.");
            setIsLoading(false);
            return false;
          }

          // If we get here without a clear status, consider it a failure
          setError(
            "verify-transaction",
            "Verification returned unclear status"
          );
          toast.error(
            "Transaction verification returned an unclear result. Please contact support."
          );
          setIsLoading(false);
          return false;
        } catch (error) {
          console.error("Error during Solana verification:", error);

          if (attempts < maxAttempts) {
            // Error during verification, try again
            attempts++;
            console.log(
              `Verification error. Retrying. Attempt ${attempts}/${maxAttempts}`
            );
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            return pollTransactionVerification(); // Recursively poll again
          }

          setError("verify-transaction", "Transaction verification error");
          toast.error("Error verifying transaction. Please contact support.");
          setIsLoading(false);
          return false;
        }
      };

      // Start polling for transaction verification
      const verificationSuccess = await pollTransactionVerification();

      if (!verificationSuccess) {
        return false;
      }

      nextStep(); // Move to next step

      // Step 5: Save allocation in database
      setCurrentStep("save-allocation");

      // Complete all steps
      completeTransaction();
      toast.success(`Successfully purchased ${tokenAmount} LMX tokens!`);
      return true;
    } catch (error: any) {
      console.error("Error in Solana purchase:", error);

      // Determine which step failed based on where the error occurred
      const currentStep = status.currentStepId || "prepare-transaction";
      setError(currentStep, error.message || "An unexpected error occurred");

      toast.error("Failed to complete the purchase. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsLoading(false);
  };

  return {
    buyTokens,
    isLoading,
    solPrice,
    lmxPriceUsd: LMX_PRICE_USD,
    transactionStatus: status,
    isModalOpen,
    closeModal,
    transactionSignature,
  };
}

import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { fetchCryptoPrices, calculateCryptoCost } from "@/lib/price-utils";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useTransactionStatus, TransactionStep } from "./useTransactionStatus";
import {
  BSC_PRESALE_CONTRACT_ADDRESS,
  BSC_USDT_ADDRESS,
} from "@/lib/constants";
import { parseEther } from "ethers";
import { usdtPresaleAbi } from "@/lib/abi-usdt";

// Initial transaction steps for BSC USDT approval
const initialApprovalSteps: TransactionStep[] = [
  {
    id: "wallet-connect",
    title: "Connect Wallet",
    description: "Connect to your BSC wallet",
    status: "pending",
  },
  {
    id: "check-balance",
    title: "Check Balance",
    description: "Verify sufficient USDT balance",
    status: "pending",
  },
  {
    id: "send-approval",
    title: "Send Approval",
    description: "Sign and send USDT approval to the BSC network",
    status: "pending",
  },
  {
    id: "confirm-approval",
    title: "Confirm Approval",
    description: "Wait for approval confirmation",
    status: "pending",
  },
];

// Initial transaction steps for BSC USDT purchase
const initialPurchaseSteps: TransactionStep[] = [
  {
    id: "wallet-connect",
    title: "Connect Wallet",
    description: "Connect to your BSC wallet",
    status: "pending",
  },
  {
    id: "check-approval",
    title: "Check Approval",
    description: "Verify USDT is approved for spending",
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

// USDT token ABI (ERC20 standard) for approval
const usdtAbi = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export function useBscUsdtPresale(tokenAmount: number, referrer?: string) {
  const [dynamicCost, setDynamicCost] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [usdtPrice, setUsdtPrice] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // This controls whether we're in approval or purchase flow
  const [isApprovalMode, setIsApprovalMode] = useState(false);
  // This controls which transaction steps to show in the modal
  const [displayedMode, setDisplayedMode] = useState<"approval" | "purchase">(
    "approval"
  );
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);
  const [approvalCompleted, setApprovalCompleted] = useState(false);
  const [purchaseInitiated, setPurchaseInitiated] = useState(false);
  const { address } = useAccount();

  // Initialize transaction status using the displayedMode to determine which steps to show
  const {
    status: transactionStatus,
    setCurrentStep,
    currentStep,
    nextStep,
    completeTransaction,
    setError,
    resetStatus,
    completeAllSteps,
  } = useTransactionStatus(
    displayedMode === "approval" ? initialApprovalSteps : initialPurchaseSteps
  );

  // Check presale status
  const { data: presaleStatus } = useReadContract({
    address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
    abi: usdtPresaleAbi,
    functionName: "presaleActive",
  });

  // Check USDT balance
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: BSC_USDT_ADDRESS as `0x${string}`,
    abi: usdtAbi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  // Check USDT allowance
  const { data: usdtAllowance, refetch: refetchUsdtAllowance } =
    useReadContract({
      address: BSC_USDT_ADDRESS as `0x${string}`,
      abi: usdtAbi,
      functionName: "allowance",
      args: [
        address as `0x${string}`,
        BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
      ],
    });

  // Write contract hook for approving USDT
  const {
    writeContract: approveUsdt,
    data: approvalHash,
    isPending: isApprovePending,
    isSuccess: isApproveSuccess,
    error: approveError,
    reset: resetApproval,
  } = useWriteContract();

  // Wait for approval transaction confirmation
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    isError: isApprovalError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}`,
  });

  // Write contract hook for buying tokens with USDT
  const {
    writeContract: buyWithUsdt,
    data: purchaseHash,
    isPending: isPurchasePending,
    isSuccess: isPurchaseSuccess,
    isError: isPurchaseError,
    error: purchaseError,
    reset: resetPurchase,
  } = useWriteContract();

  // Wait for purchase transaction confirmation
  const {
    isLoading: isPurchaseConfirming,
    isSuccess: isPurchaseConfirmed,
    isError: isPurchaseTransactionError,
  } = useWaitForTransactionReceipt({
    hash: purchaseHash as `0x${string}`,
  });

  // Calculate cost in USDT
  useEffect(() => {
    const calculateUsdtCost = async () => {
      if (!tokenAmount || tokenAmount <= 0) return;

      setIsLoadingPrice(true);
      try {
        const prices = await fetchCryptoPrices();
        const usdtCost = calculateCryptoCost(tokenAmount, "usdt", prices);
        setDynamicCost(parseUnits(usdtCost.toString(), 18));
      } catch (error) {
        console.error("Error calculating token cost:", error);
        toast.error("Error calculating USDT cost. Please try again.");
      } finally {
        setIsLoadingPrice(false);
      }
    };

    calculateUsdtCost();
  }, [tokenAmount]);

  // Handle approval transaction confirmation
  useEffect(() => {
    if (isApprovalConfirmed && !approvalCompleted) {
      console.log("Approval confirmed");
      setApprovalCompleted(true);
      refetchUsdtAllowance();

      // Move to confirmation step in approval mode
      if (isApprovalMode) {
        setCurrentStep("confirm-approval");
        nextStep();
        completeTransaction();
        completeAllSteps();
        resetStatus();
        setDisplayedMode("purchase"); // Switch to purchase mode after approval

        toast.success(
          "USDT approved successfully! You can now purchase tokens."
        );
        setTimeout(() => {
          setIsLoading(false);
          setIsModalOpen(false);
        }, 2000);
      }
    }
  }, [
    isApprovalConfirmed,
    isApproveSuccess,
    approvalHash,
    approvalCompleted,
    isApprovalMode,
    refetchUsdtAllowance,
    setCurrentStep,
    nextStep,
    completeTransaction,
    resetStatus,
  ]);

  // Handle approval errors
  useEffect(() => {
    if (isApprovalError && approvalHash) {
      console.error("Approval transaction failed");
      setError("approve-usdt", "Approval transaction failed");
      toast.error("USDT approval failed. Please try again.");
      setIsLoading(false);
    }
  }, [isApprovalError, approvalHash, setError]);

  // Verification function
  const verifyTransaction = useCallback(
    async (hash: string) => {
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 5000;

      const pollForVerification = async (): Promise<void> => {
        try {
          console.log(
            `Verifying transaction attempt ${attempts + 1}/${maxAttempts}`
          );

          // First check if the transaction is already completed in the database
          const statusResponse = await fetch(
            "/api/presale/check-transaction-status",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                hash: hash,
              }),
            }
          );

          const statusData = await statusResponse.json();
          console.log("Transaction status check:", statusData);

          // If already verified in the database, we're done
          if (statusData.verified) {
            console.log("Transaction already verified in the database");
            setCurrentStep("save-allocation");
            nextStep();
            completeTransaction();
            completeAllSteps();
            toast.success(
              `Successfully purchased ${tokenAmount} LMX tokens with USDT!`
            );
            setIsLoading(false);
            return;
          }

          // If not found or not verified, proceed with blockchain verification
          const verificationResponse = await fetch(
            "/api/presale/verify-bsc-usdt",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                hash: hash,
              }),
            }
          );

          const responseData = await verificationResponse.json();
          console.log("Verification response:", responseData);

          if (responseData.status === "PENDING" && attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForVerification, pollInterval);
            return;
          }

          if (!verificationResponse.ok || !responseData.verified) {
            console.error("Transaction verification failed:", responseData);
            // setError(
            //   "verify-transaction",
            //   responseData.message || "Transaction verification failed"
            // );
            // toast.error(
            //   "Transaction verification failed. Please contact support."
            // );
            setIsLoading(false);
            return;
          }

          // Success
          console.log("Transaction verified successfully");
          setCurrentStep("save-allocation");
          nextStep();
          completeTransaction();
          toast.success(
            `Successfully purchased ${tokenAmount} LMX tokens with USDT!`
          );
          setIsLoading(false);
        } catch (error) {
          console.error("Error verifying transaction:", error);
          //   setError(
          //     "verify-transaction",
          //     "Error verifying transaction. Please check your wallet."
          //   );
          //   toast.error("Error verifying transaction. Please check your wallet.");
          setIsLoading(false);
        }
      };

      // Start polling
      await pollForVerification();
    },
    [setCurrentStep, nextStep, completeTransaction, tokenAmount]
  );
  // Handle purchase transaction confirmation
  useEffect(() => {
    if (isPurchaseConfirmed && purchaseHash && !transactionSignature) {
      console.log("Purchase confirmed, starting verification");
      setTransactionSignature(purchaseHash);
      setCurrentStep("verify-transaction");
      nextStep();

      // Start verification process
      verifyTransaction(purchaseHash);
    }
  }, [
    verifyTransaction,
    isPurchaseConfirmed,
    purchaseHash,
    transactionSignature,
    setCurrentStep,
    nextStep,
  ]);

  // Handle purchase errors
  useEffect(() => {
    if (isPurchaseTransactionError && purchaseHash) {
      console.error("Purchase transaction failed");
      setError("send-transaction", "Purchase transaction failed");
      toast.error("Purchase transaction failed. Please try again.");
      setIsLoading(false);
    }
  }, [isPurchaseTransactionError, purchaseHash, setError]);

  // Separate function to initiate purchase
  const initiatePurchase = useCallback(async () => {
    if (purchaseInitiated) return;

    console.log("Initiating purchase transaction");
    setPurchaseInitiated(true);

    try {
      setCurrentStep("send-transaction");
      nextStep();

      await buyWithUsdt({
        address: BSC_PRESALE_CONTRACT_ADDRESS as `0x${string}`,
        abi: usdtPresaleAbi,
        functionName: "buyTokensWithUsdt",
        args: [parseEther(tokenAmount.toString())],
      });

      console.log("Purchase transaction sent");
    } catch (error) {
      console.error("Error sending purchase transaction:", error);
      setError("send-transaction", "Failed to send purchase transaction");
      toast.error("Failed to send purchase transaction");
      setIsLoading(false);
      setPurchaseInitiated(false);
    }
  }, [
    purchaseInitiated,
    buyWithUsdt,
    tokenAmount,
    setCurrentStep,
    nextStep,
    setError,
  ]);

  // Function to approve USDT spending - now exported separately
  const approveUsdtSpending = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!presaleStatus) {
      toast.error("Presale is not active");
      return;
    }

    if (tokenAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Reset states related to approval
    resetStatus();
    resetApproval();
    setDisplayedMode("approval"); // Show approval steps in the modal
    setApprovalCompleted(false);
    setIsModalOpen(true);
    setIsLoading(true);
    setIsApprovalMode(true); // Set the functional mode to approval

    try {
      console.log("Starting USDT approval process");

      // Step 1: Wallet connect
      setCurrentStep("wallet-connect");
      nextStep();

      // Step 2: Check USDT balance
      setCurrentStep("check-balance");
      await refetchUsdtBalance();

      if (
        usdtBalance !== undefined &&
        BigInt(usdtBalance?.toString() ?? "") < dynamicCost
      ) {
        toast.error("Insufficient USDT balance");
        setError("check-balance", "Insufficient USDT balance");
        setIsLoading(false);
        setIsModalOpen(false);
        return;
      }
      nextStep();

      // Check current allowance first
      await refetchUsdtAllowance();
      const currentAllowance = usdtAllowance as bigint;
      console.log(
        "Current allowance:",
        currentAllowance?.toString(),
        "Required:",
        dynamicCost.toString()
      );

      if (!currentAllowance || currentAllowance < dynamicCost) {
        console.log("Approval needed, requesting approval");

        // Step 3: Send approval transaction
        setCurrentStep("send-approval");

        try {
          await approveUsdt({
            address: BSC_USDT_ADDRESS as `0x${string}`,
            abi: usdtAbi,
            functionName: "approve",
            args: [BSC_PRESALE_CONTRACT_ADDRESS, dynamicCost * BigInt(2)], // Approve 2x for future transactions
          });

          console.log("Approval transaction sent");
          toast.success("USDT approval transaction sent");
          nextStep(); // Move to waiting for confirmation
          // The approval confirmation will be handled by the useEffect above
        } catch (error) {
          console.error("Error requesting approval:", error);
          setError("send-approval", "Failed to request USDT approval");
          toast.error("Failed to request USDT approval");
          setIsLoading(false);
          setIsModalOpen(false);
          return;
        }
      } else {
        console.log("Sufficient allowance already exists");
        toast.success("You have already approved USDT spending");
        setApprovalCompleted(true);
        setCurrentStep("send-approval");
        nextStep();
        setCurrentStep("confirm-approval");
        nextStep();
        completeTransaction();
        setTimeout(() => {
          setIsLoading(false);
          setIsModalOpen(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error in approval process:", error);
      toast.error("An unexpected error occurred during approval");
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  // Main function to buy tokens with USDT (after approval)
  const buyTokens = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!presaleStatus) {
      toast.error("Presale is not active");
      return;
    }

    if (tokenAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Check if USDT is approved first
    await refetchUsdtAllowance();
    const currentAllowance = usdtAllowance as bigint;

    if (!currentAllowance || currentAllowance < dynamicCost) {
      await approveUsdt({
        address: BSC_USDT_ADDRESS as `0x${string}`,
        abi: usdtAbi,
        functionName: "approve",
        args: [BSC_PRESALE_CONTRACT_ADDRESS, dynamicCost * BigInt(2)], // Approve 2x for future transactions
      });
      setTimeout(() => {}, 3000);
      // return false; // Return false to indicate approval is needed
    }

    // Reset purchase-related states
    resetStatus();
    resetPurchase();
    setPurchaseInitiated(false);
    setTransactionSignature(null);
    setDisplayedMode("purchase"); // Show purchase steps in the modal
    setIsModalOpen(true);
    setIsLoading(true);
    setIsApprovalMode(false); // Set to purchase mode for functional flow

    try {
      console.log("Starting purchase process with pre-approved USDT");

      // Step 1: Connect wallet
      setCurrentStep("wallet-connect");
      nextStep();

      // Step 2: Check approval status
      setCurrentStep("check-approval");
      await refetchUsdtAllowance();
      const refreshedAllowance = usdtAllowance as bigint;

      if (!refreshedAllowance || refreshedAllowance < dynamicCost) {
        setError("check-approval", "USDT approval insufficient or expired");
        toast.error(
          "USDT approval insufficient. Please approve USDT spending first."
        );
        setIsLoading(false);
        setIsModalOpen(false);
        return false;
      }
      nextStep();

      // Step 3: Prepare transaction
      setCurrentStep("prepare-transaction");
      nextStep();

      // Step 4: Initiate purchase
      initiatePurchase();
      return true;
    } catch (error) {
      console.error("Error in buy process:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
      setIsModalOpen(false);
      return false;
    }
  };

  // Reset all states function to be used after a successful transaction
  const resetState = () => {
    // Reset modal and loading states
    setIsModalOpen(false);
    setIsLoading(false);

    // Reset transaction status states
    resetStatus();

    // Reset transaction flow states
    setApprovalCompleted(false);
    setPurchaseInitiated(false);
    setTransactionSignature(null);

    // Reset transaction data
    resetApproval();
    resetPurchase();

    // Reset modes to default for next action
    setDisplayedMode("purchase");

    // Note: We don't reset isApprovalMode here as it represents the functional state
    // and should be determined by checking allowance the next time the user interacts
  };

  // Close modal function - now using the resetState function
  const closeModal = () => {
    resetState();
  };

  // Helper function to check if USDT is approved
  const isUsdtApproved = useCallback(async () => {
    await refetchUsdtAllowance();
    return usdtAllowance && BigInt(usdtAllowance.toString()) >= dynamicCost;
  }, [refetchUsdtAllowance, usdtAllowance, dynamicCost]);

  return {
    buyTokens,
    approveUsdtSpending, // Expose approval function separately
    isUsdtApproved, // Add helper to check approval status
    isApprovalMode, // Expose whether we're in approval or purchase mode
    displayedMode, // Expose which mode is being displayed in the modal
    approvalCompleted, // Expose approval state
    isLoading,
    isModalOpen,
    closeModal,
    resetState, // Expose the reset function for external use
    transactionStatus,
    transactionSignature,
    usdtBalance,
    refreshUsdtBalance: refetchUsdtBalance,
  };
}

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  hash: string;
  status: string;
  network: string;
  createdAt: string;
  tokenAmount: string;
  paymentAmount: string;
  paymentCurrency: string;
}

// Verification response interface
interface VerificationResponse {
  verified: boolean;
  status?: string;
  error?: string;
  message?: string;
  transaction?: Transaction;
  purchase?: any;
}

export function PendingTransactions() {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [processingTransactions, setProcessingTransactions] = useState<
    Set<string>
  >(new Set());
  const [verificationAttempts, setVerificationAttempts] = useState<
    Record<string, number>
  >({});
  const { data: session } = useSession();

  // Verify a transaction based on its network and currency
  const verifyTransaction = useCallback(
    async (tx: Transaction) => {
      if (!tx || processingTransactions.has(tx.id)) return;

      // Track that we're processing this transaction
      setProcessingTransactions((prev) => new Set(prev).add(tx.id));

      try {
        // First check if the transaction is already completed in the database
        const statusResponse = await fetch(
          "/api/presale/check-transaction-status",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hash: tx.hash }),
          }
        );

        const statusData = await statusResponse.json();

        // If already verified in the database, we're done
        if (statusResponse.ok && statusData.verified) {
          toast.success(
            `Transaction verified: ${tx.paymentAmount} ${tx.paymentCurrency} purchase confirmed`,
            {
              description: `You've successfully purchased LMX tokens on ${tx.network}`,
            }
          );

          // Remove from pending list
          setPendingTransactions((prev) => prev.filter((t) => t.id !== tx.id));
          return;
        }

        // If not verified in the database, try blockchain verification
        let endpoint = "";
        // Determine the correct verification endpoint based on network and currency
        if (tx.network === "BSC") {
          endpoint =
            tx.paymentCurrency === "USDT"
              ? "/api/presale/verify-bsc-usdt"
              : "/api/presale/verify-bsc";
        } else if (tx.network === "SOLANA") {
          endpoint =
            tx.paymentCurrency === "USDT"
              ? "/api/presale/verify-solana-usdt"
              : "/api/presale/verify-solana2";
        }

        if (!endpoint) {
          throw new Error(
            `Unsupported network or currency: ${tx.network} ${tx.paymentCurrency}`
          );
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hash: tx.network === "BSC" ? tx.hash : undefined,
            signature: tx.network === "SOLANA" ? tx.hash : undefined,
          }),
        });

        const result: VerificationResponse = await response.json();

        // Handle different verification responses
        if (response.ok) {
          if (result.verified || result.status === "SUCCESS") {
            // Transaction verified successfully
            toast.success(
              `Transaction verified: ${tx.paymentAmount} ${tx.paymentCurrency} purchase confirmed`,
              {
                description: `You've successfully purchased LMX tokens on ${tx.network}`,
              }
            );

            // Remove from pending list
            setPendingTransactions((prev) =>
              prev.filter((t) => t.id !== tx.id)
            );
          } else if (result.status === "PENDING") {
            // Still pending, increment attempt counter
            setVerificationAttempts((prev) => ({
              ...prev,
              [tx.id]: (prev[tx.id] || 0) + 1,
            }));
          } else if (result.status === "FAILED" || result.status === "ERROR") {
            // Transaction failed
            toast.error(
              `Transaction failed: ${result.message || result.error || "Unknown error"}`,
              {
                description: `Your ${tx.network} transaction could not be verified.`,
              }
            );

            // Remove from pending list
            setPendingTransactions((prev) =>
              prev.filter((t) => t.id !== tx.id)
            );
          }
        } else {
          // API error
          if (result.error?.includes("after multiple attempts")) {
            toast.error(`Transaction verification failed`, {
              description: `The system could not verify your ${tx.network} transaction after multiple attempts.`,
            });
            // Remove from pending list
            setPendingTransactions((prev) =>
              prev.filter((t) => t.id !== tx.id)
            );
          }
        }
      } catch (error) {
        console.error(`Error verifying transaction ${tx.hash}:`, error);
      } finally {
        // Remove this transaction from processing list
        setProcessingTransactions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tx.id);
          return newSet;
        });
      }
    },
    [processingTransactions]
  );

  // Initial data fetch
  useEffect(() => {
    // Fetch pending transactions
    const fetchPendingTransactions = async () => {
      if (!session) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/presale/pending-transactions");

        if (!response.ok) {
          throw new Error("Failed to fetch pending transactions");
        }

        const data = await response.json();
        setPendingTransactions(data.pendingTransactions);
      } catch (error) {
        console.error("Error fetching pending transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (!session) return;
    fetchPendingTransactions();
  }, [session]);

  // Verify transactions with a smart retry strategy
  useEffect(() => {
    if (!pendingTransactions.length) return;

    // Create a map to track verification intervals

    // Process each pending transaction
    pendingTransactions.forEach(async (tx) => {
      // Skip if already processing
      if (processingTransactions.has(tx.id)) return;

      await verifyTransaction(tx);
    });
  }, [pendingTransactions, verifyTransaction, processingTransactions]);

  // If no transactions or loading, don't show anything
  if (isLoading && pendingTransactions.length === 0) {
    return null;
  }

  // If no pending transactions, don't show anything
  if (pendingTransactions.length === 0) {
    return null;
  }

  return (
    <div className="w-full p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg mt-4">
      <h3 className="text-lg font-medium text-white mb-2">
        Pending Transactions
      </h3>
      <div className="space-y-2">
        {pendingTransactions.map((tx) => {
          const isProcessing = processingTransactions.has(tx.id);
          const attemptCount = verificationAttempts[tx.id] || 0;

          return (
            <div
              key={tx.id}
              className="flex flex-col p-3 bg-white/5 rounded-md"
            >
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Transaction Hash:</span>
                <a
                  href={`${tx.network === "BSC" ? "https://bscscan.com/tx/" : "https://solscan.io/tx/"}${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 truncate max-w-[200px]"
                >
                  {tx.hash.substring(0, 10)}...
                  {tx.hash.substring(tx.hash.length - 8)}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Status:</span>
                <span className="text-sm font-medium text-yellow-400">
                  {isProcessing ? (
                    <>
                      Verifying<span className="ml-1 animate-pulse">...</span>
                    </>
                  ) : attemptCount >= 5 ? (
                    "Verification paused"
                  ) : (
                    <>
                      Pending Verification
                      <span className="ml-1 animate-pulse">...</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Network:</span>
                <span className="text-sm text-white">{tx.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Currency:</span>
                <span className="text-sm text-white">{tx.paymentCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Submitted:</span>
                <span className="text-sm text-white">
                  {new Date(tx.createdAt).toLocaleString()}
                </span>
              </div>
              {attemptCount >= 5 && (
                <button
                  onClick={() => {
                    setVerificationAttempts((prev) => ({
                      ...prev,
                      [tx.id]: 0,
                    }));
                    verifyTransaction(tx);
                  }}
                  className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Try Again
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

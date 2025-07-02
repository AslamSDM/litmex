"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";

interface Purchase {
  id: string;
  createdAt: string;
  network: "SOLANA" | "BSC";
  paymentAmount?: string;
  paymentCurrency?: string;
  lmxTokensAllocated: string;
  pricePerLmxInUsdt?: string;
  transactionSignature: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
}

const PurchaseHistory: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, address } = useAppKitAccount();

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!address && !window.solana?.publicKey) {
        setError("Please connect your wallet to view purchase history");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/presale/history?walletAddress=" + address,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase history");
        }

        const data = await response.json();
        setPurchases(data.purchases || []);
      } catch (error) {
        console.error("Failed to fetch purchase history:", error);
        setError("Failed to load purchase history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, [address, isConnected]);

  // No filtering by network tab anymore
  const filteredPurchases = purchases;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get explorer URL
  const getExplorerUrl = (signature: string, network: "SOLANA" | "BSC") => {
    if (network === "SOLANA") {
      return `https://solscan.io/tx/${signature}${
        process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
          ? "?cluster=devnet"
          : ""
      }`;
    } else {
      return `https://bscscan.com/tx/${signature}${
        process.env.NEXT_PUBLIC_BSC_TESTNET === "true" ? "?network=testnet" : ""
      }`;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500";
      case "PENDING":
        return "text-amber-500";
      case "FAILED":
        return "text-red-500";
      case "REFUNDED":
        return "text-blue-500";
      default:
        return "text-white/70";
    }
  };

  return (
    <Card
      className={`border border-primary/20 bg-black/50 backdrop-blur-md ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-primary">Purchase History</CardTitle>
        <CardDescription>View your LMX token purchase history</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-white/70">Loading purchase history...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-400">{error}</p>
            {!address && !window.solana?.publicKey && (
              <p className="text-white/70 mt-2">
                Connect your wallet to view your purchase history
              </p>
            )}
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70">No purchase history found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-black/30 border border-primary/10 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">
                    {purchase.lmxTokensAllocated} LMX
                  </span>
                  <span className={getStatusColor(purchase.status)}>
                    {purchase.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-white/70">
                  <span>
                    {purchase.paymentAmount
                      ? `${purchase.paymentAmount} ${
                          purchase.paymentCurrency || ""
                        }`
                      : "Purchase amount not available"}
                  </span>
                  <span>{formatDate(purchase.createdAt)}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/50">
                    Network: {purchase.network}
                  </span>
                  <a
                    href={getExplorerUrl(
                      purchase.transactionSignature,
                      purchase.network
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    View Transaction <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseHistory;

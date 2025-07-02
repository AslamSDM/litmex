"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle, CheckCircle, XCircle, Coins } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { Skeleton } from "./ui/skeleton";
import { LMX_PRICE_USD } from "@/lib/price-utils";

interface Purchase {
  id: string;
  createdAt: string;
  network: string;
  paymentAmount?: string;
  paymentCurrency?: string;
  lmxTokensAllocated: string;
  pricePerLmxInUsdt?: string;
  transactionSignature: string;
  status: string;
  hasReferralBonus?: boolean;
}

interface UserActivityHistoryProps {
  purchases?: Purchase[];
}

export const UserActivityHistory: React.FC<UserActivityHistoryProps> = ({
  purchases = [],
}) => {
  const [activities, setActivities] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const appkitAccountData = useAppKitAccount();
  const { isConnected: connected } = appkitAccountData || { connected: false };
  const walletAddress = appkitAccountData?.address;

  useEffect(() => {
    // If purchases are provided via props, use them directly
    if (purchases && purchases.length > 0) {
      setActivities(purchases);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from API (fallback behavior)
    async function fetchUserActivity() {
      if (!walletAddress) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/presale/history?walletAddress=${walletAddress}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user activity");
        }

        const data = await response.json();
        setActivities(data.purchases || []);
      } catch (err) {
        console.error("Error fetching user activity:", err);
        setError("Failed to load activity history");
      } finally {
        setIsLoading(false);
      }
    }

    if (connected && walletAddress) {
      fetchUserActivity();
    }
  }, [walletAddress, connected, purchases]);

  // No need to check connection status if we have purchases from props
  if (!connected && purchases.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-white/70">
          Connect your wallet to view your activity
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "REFUNDED":
        return <Coins className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-primary" />;
    }
  };

  const calculateCurrentValue = (
    lmxAmount: string,
    pricePerLmx: string | undefined
  ) => {
    // Calculate value based on tokens and purchase price
    const tokens = parseFloat(lmxAmount);
    const purchasePrice = parseFloat(pricePerLmx || "0.01");
    const purchaseValue = tokens * purchasePrice;

    // Calculate current value based on current LMX price
    const currentValue = tokens * LMX_PRICE_USD;

    // Calculate profit/loss percentage
    const profitLossPercent =
      ((currentValue - purchaseValue) / purchaseValue) * 100;

    return {
      currentValue: currentValue.toFixed(2),
      profitLossPercent: profitLossPercent.toFixed(2),
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium luxury-text">Transaction History</h3>
      </div>

      {error ? (
        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-md text-red-400">
          <p>{error}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-black/40 border border-primary/20 rounded-md"
            >
              <Skeleton className="h-6 w-full bg-primary/10 mb-2" />
              <Skeleton className="h-4 w-3/4 bg-primary/10 mb-1" />
              <Skeleton className="h-4 w-1/2 bg-primary/10" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10 bg-black/30 border border-primary/20 rounded-lg">
          <motion.p
            className="text-white/70"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            No transactions found.
          </motion.p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const { currentValue, profitLossPercent } = calculateCurrentValue(
              activity.lmxTokensAllocated,
              activity.pricePerLmxInUsdt
            );

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 bg-black/40 border border-primary/20 rounded-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    {getStatusIcon(activity.status)}
                    <span className="ml-2 font-medium text-white">
                      {parseFloat(activity.lmxTokensAllocated).toLocaleString()}{" "}
                      LMX
                    </span>
                  </div>
                  <div className="text-white/80 text-sm">
                    {formatDate(activity.createdAt)}
                  </div>
                </div>

                {activity.paymentAmount &&
                  activity.paymentCurrency &&
                  activity.pricePerLmxInUsdt && (
                    <div className="text-white/70 text-sm mt-2 flex flex-wrap justify-between">
                      <span className="mr-4">
                        Paid:{" "}
                        {parseFloat(activity.paymentAmount || "0").toFixed(2)}{" "}
                        {activity.paymentCurrency}(
                        {(
                          parseFloat(activity.paymentAmount) *
                          parseFloat(activity.pricePerLmxInUsdt || "0")
                        ).toFixed(2)}{" "}
                        USD)
                      </span>

                      <span className="flex items-center">
                        Network:
                        <span className="ml-1 capitalize text-primary">
                          {activity.network.toLowerCase()}
                        </span>
                      </span>
                    </div>
                  )}

                {activity.pricePerLmxInUsdt && (
                  <div className="text-white/70 text-sm mt-1 flex flex-wrap justify-between">
                    <span>
                      Price: $
                      {parseFloat(activity.pricePerLmxInUsdt || "0").toFixed(2)}{" "}
                      per LMX
                    </span>

                    <div
                      className={`flex items-center ${
                        parseFloat(profitLossPercent) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      Current value: ${currentValue}
                      <span className="ml-1">
                        ({parseFloat(profitLossPercent) >= 0 ? "+" : ""}
                        {profitLossPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {activity.hasReferralBonus && (
                  <div className="mt-2 text-xs bg-primary/10 text-primary p-1 px-2 rounded-full inline-block">
                    With Referral Bonus
                  </div>
                )}

                <div className="mt-2 text-xs text-white/50 break-all">
                  Tx: {activity.transactionSignature}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

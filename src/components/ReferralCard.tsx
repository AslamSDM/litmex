"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Users } from "lucide-react";
import LuxuryCard from "./LuxuryCard";
import { generateReferralUrl } from "@/lib/referral";
import { useSession } from "next-auth/react";
import ReferralStats from "./ReferralStats";
import "./ReferralCard.css";

interface ReferralPaymentStats {
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalPaidUsd: number;
  totalPendingUsd: number;
  completedPaymentsCount: number;
  pendingPaymentsCount: number;
}

interface ReferralCardProps {
  className?: string;
  totalBonus?: number;
  referralCount?: number;
  paymentStats?: ReferralPaymentStats;
  serverRenderedStats?: {
    totalBonus: string;
    totalPendingBonus: string;
    totalUsd: string;
    totalPendingUsd: string;
    referralCount: number;
    referralCode: string;
    solanaVerified: boolean;
    payments: {
      completed: number;
      pending: number;
    };
  };
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  className = "",
  totalBonus = 0,
  referralCount = 0,
  paymentStats,
  serverRenderedStats,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bonusStats, setBonusStats] = useState({
    totalBonus: "0",
    count: 0,
    referralCount: 0,
  });
  const { data: session, status } = useSession();
  // Ensure we have fresh data
  useEffect(() => {
    // fetchUserReferralInfo();

    // Fetch referral bonus data if we have a wallet connected
    const fetchBonusData = async () => {
      if (status !== "authenticated") return;
      if (!session?.user.referralCode) return;

      // Skip fetching if we already have server-rendered stats
      if (serverRenderedStats) {
        return;
      }

      try {
        const response = await fetch(
          `/api/referral/bonuses?referralCode=${session.user.referralCode}`
        );
        if (response.ok) {
          const data = await response.json();
          setBonusStats({
            totalBonus: data.totalBonus || "0",
            count: data.count || 0,
            referralCount: data.referralCount || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching referral bonus data:", error);
      }
    };

    fetchBonusData();
  }, [session, status, serverRenderedStats]);

  // If no referral code is provided or fetched, generate a placeholder

  const handleCopyReferralLink = () => {
    if (!session?.user.referralCode) {
      console.error("No referral code available to copy");
      return;
    }
    const referralLink = generateReferralUrl(session?.user.referralCode);
    navigator.clipboard.writeText(referralLink);
    setCopied(true);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!session?.user?.referralCode) return null;
  return (
    <LuxuryCard className={`p-3 sm:p-4 md:p-6 ${className} w-full`}>
      <div className="flex items-center mb-4 flex-wrap">
        <Share2 className="w-6 h-6 text-primary mr-3" />
        <h3 className="text-xl font-bold sm:text-lg">
          Refer Friends & Earn 10% Bonus
        </h3>
      </div>

      <p className="text-gray-300 mb-6 text-sm sm:text-xs">
        Share your unique referral link with friends and earn 10% bonus in
        $TRUMP tokens on their contribution
      </p>

      <div className="relative">
        <div className="flex flex-col sm:flex-row">
          <input
            type="text"
            readOnly
            value={generateReferralUrl(session?.user.referralCode)}
            className="referral-link-input flex-grow bg-black/50 border border-primary/30 sm:rounded-l-md rounded-t-md sm:rounded-tr-none p-3 text-white/90 focus:outline-none text-xs sm:text-sm overflow-ellipsis"
          />
          <button
            onClick={handleCopyReferralLink}
            className="bg-primary text-primary-foreground px-4 sm:rounded-r-md rounded-b-md sm:rounded-bl-none hover:bg-primary/90 transition-all flex items-center justify-center py-2 sm:py-0"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Shimmer effect on the input */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-fast"></div>
        </div>
      </div>

      {/* Use ReferralStats component instead of the inline stats */}
      {/* <div className="mt-6">
        <ReferralStats serverRenderedStats={serverRenderedStats} />
      </div> */}

      {/* Social sharing options */}
      <div className="flex flex-wrap justify-center mt-6 gap-3">
        {[
          {
            name: "Twitter",
            url: `https://twitter.com/intent/tweet?text=Join me on Antilix using my referral link&url=${encodeURIComponent(generateReferralUrl(session?.user.referralCode))}`,
          },
          {
            name: "Telegram",
            url: `https://t.me/share/url?url=${encodeURIComponent(generateReferralUrl(session?.user.referralCode))}&text=Join me on Antilix using my referral link`,
          },
        ].map((platform, index) => (
          <motion.a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="referral-share-button bg-black/40 border border-primary/20 rounded-md px-3 py-2 text-xs sm:text-sm hover:border-primary/50 transition-all inline-block text-center min-w-[90px] flex-1 sm:flex-initial"
            whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            Share on {platform.name}
          </motion.a>
        ))}
      </div>

      {/* Rewards visualization */}
    </LuxuryCard>
  );
};

export default ReferralCard;

// {serverRenderedStats?.referralCount && (
//   <div className="mt-6 pt-6 border-t border-primary/20">
//     <h4 className="font-medium mb-3 text-center">
//       Your Referral Rewards
//     </h4>
//     <div className="flex flex-wrap justify-between items-center">
//       <div className="text-xs sm:text-sm text-gray-400">
//         Total Referred
//       </div>
//       <div className="text-sm font-medium">
//         {serverRenderedStats ? serverRenderedStats.referralCount : 0}{" "}
//         Users
//       </div>
//     </div>
//     <div className="flex flex-wrap justify-between items-center mt-2">
//       <div className="text-xs sm:text-sm text-gray-400">
//         Total Value Earned
//       </div>
//       <div className="text-sm font-medium text-primary">
//         $
//         {serverRenderedStats
//           ? parseFloat(serverRenderedStats.totalUsd).toLocaleString(
//               undefined,
//               { maximumFractionDigits: 2 }
//             )
//           : "0.00"}
//       </div>
//     </div>

//     {/* Payment Stats Summary */}
//     {(paymentStats ||
//       (serverRenderedStats?.payments &&
//         (serverRenderedStats.payments.completed > 0 ||
//           serverRenderedStats.payments.pending > 0))) && (
//       <div className="mt-4">
//         <div className="flex flex-wrap justify-between items-center mt-2">
//           <div className="text-xs sm:text-sm text-gray-400">
//             Completed Payments
//           </div>
//           <div className="text-sm font-medium text-primary">
//             {paymentStats?.completedPaymentsCount ||
//               serverRenderedStats?.payments?.completed ||
//               0}
//           </div>
//         </div>
//         <div className="flex flex-wrap justify-between items-center mt-2">
//           <div className="text-xs sm:text-sm text-gray-400">
//             Pending Payments
//           </div>
//           <div className="text-sm font-medium text-yellow-300">
//             {paymentStats?.pendingPaymentsCount ||
//               serverRenderedStats?.payments?.pending ||
//               0}
//           </div>
//         </div>
//       </div>
//     )}
//   </div>
// )}

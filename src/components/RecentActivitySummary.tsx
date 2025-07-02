"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";

interface Purchase {
  id: string;
  createdAt: string;
  lmxTokensAllocated: string;
  status: string;
  network: string;
  transactionSignature: string;
}

import { Session } from "next-auth";

interface RecentActivitySummaryProps {
  activity?: Purchase | null;
  session?: Session | null;
}

export const RecentActivitySummary: React.FC<RecentActivitySummaryProps> = ({
  activity,
  session,
}) => {
  const [recentActivities, setRecentActivities] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract user identifier from session or wallet
  const userId = session?.user?.id;

  useEffect(() => {
    async function fetchRecentActivity() {
      try {
        setIsLoading(true);

        // Build the query parameters based on available data

        const response = await fetch(`/api/presale/history`);

        if (!response.ok) {
          throw new Error("Failed to fetch activity");
        }

        const data = await response.json();
        // Only take the most recent 3 activities
        setRecentActivities((data.purchases || []).slice(0, 3));
      } catch (err) {
        console.error("Error fetching recent activity:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (activity) return;
    fetchRecentActivity();
  }, [userId, activity]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-full bg-primary/10" />
        ))}
      </div>
    );
  }

  if (recentActivities.length === 0) {
    return <p className="text-white/70">No recent activity to display.</p>;
  }

  return (
    <div className="space-y-3">
      {recentActivities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex justify-between items-center border-b border-primary/10 pb-2"
        >
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-primary/70 mr-2" />
            <span className="text-white/80 text-sm">
              {parseFloat(activity.lmxTokensAllocated).toLocaleString()} LMX
            </span>
          </div>

          <div className="flex items-center">
            <span className="text-primary/80 text-xs mr-2">
              {formatDate(activity.createdAt)}
            </span>

            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link
                href="/profile?tab=activity"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      ))}

      <motion.div
        whileHover={{ color: "rgba(212,175,55,1)" }}
        className="text-right text-xs text-primary/70 mt-2"
      >
        <Link href="/profile?tab=activity">View all activity →</Link>
      </motion.div>
    </div>
  );
};

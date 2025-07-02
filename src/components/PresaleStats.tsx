"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Database, Clock, Gift } from "lucide-react";

interface PresaleStatsProps {
  contributors: number;
  raised: number;
  usdRaised?: number;
  daysLeft: number;
  referralBonus: string;
  className?: string;
}

export const PresaleStats: React.FC<PresaleStatsProps> = ({
  contributors,
  raised,
  usdRaised,
  daysLeft,
  referralBonus,
  className = "",
}) => {
  const statsItems = [
    {
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      value: contributors,
      label: "Contributors",
      formatter: (val: number) => val.toLocaleString(),
    },
    {
      icon: <Database className="w-6 h-6 text-primary" />,
      value: raised,
      label: "SOL Raised",
      formatter: (val: number) => val.toFixed(2),
    },
    {
      icon: <Database className="w-6 h-6 text-emerald-400" />,
      value: usdRaised ? usdRaised : raised * 170, // Fallback calculation if usdRaised isn't provided
      label: "USD Value",
      formatter: (val: number) => `$${val.toLocaleString()}`,
    },

    {
      icon: <Gift className="w-6 h-6 text-rose-400" />,
      value: referralBonus,
      label: "Trump Bonus",
      formatter: (val: string) => val,
      isString: true,
    },
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {statsItems.map((item, index) => (
        <motion.div
          key={index}
          className="bg-black/40 backdrop-blur-sm border border-primary/30 rounded-lg p-4 text-center
                     hover:border-primary/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * index }}
          whileHover={{
            y: -5,
            boxShadow:
              "0 10px 20px rgba(0,0,0,0.3), 0 0 10px rgba(212,175,55,0.2)",
          }}
        >
          <div className="flex justify-center mb-3">{item.icon}</div>

          <motion.div
            className="text-2xl font-bold mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              delay: 0.2 + 0.1 * index,
              duration: 0.6,
            }}
          >
            {item.value}
          </motion.div>

          <div className="text-sm text-gray-400">{item.label}</div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/40"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/40"></div>
        </motion.div>
      ))}
    </div>
  );
};

export default PresaleStats;

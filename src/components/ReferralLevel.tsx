import React from "react";
import LuxuryCard from "./LuxuryCard";
import { DecorativeIcon } from "./DecorativeElements";

// ReferralLevel component
interface ReferralLevelProps {
  level: number;
  title: string;
  description: string;
  percentage: number;
  isLast?: boolean;
}

const ReferralLevel = ({
  level,
  title,
  description,
  percentage,
  isLast = false,
}: ReferralLevelProps) => {
  return (
    <div className="relative flex items-start">
      {/* Level circle */}
      <div className="flex-shrink-0 mr-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 relative z-10">
          <span className="text-primary font-bold text-sm">{level}</span>
        </div>
        {/* Connecting line */}
        {!isLast && (
          <div className="absolute left-5 top-10 w-0.5 h-8 bg-primary/20 transform -translate-x-0.5"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-white text-base">{title}</h4>
          <span className="text-xl font-bold text-primary">{percentage}%</span>
        </div>
        <p className="text-sm text-gray-300 mb-4">{description}</p>
      </div>
    </div>
  );
};

const ReferralSystem = () => {
  const levels = [
    {
      level: 1,
      title: "Level 1 - Direct Referrals",
      description: "Your direct invites",
      percentage: 15,
    },
    {
      level: 2,
      title: "Level 2",
      description: "Your referrals' referrals",
      percentage: 15,
    },
    {
      level: 3,
      title: "Level 3",
      description: "Third level referrals",
      percentage: 15,
    },
    {
      level: 4,
      title: "Level 4",
      description: "Fourth level referrals",
      percentage: 15,
    },
    {
      level: 5,
      title: "Level 5",
      description: "Fifth level referrals",
      percentage: 15,
    },
  ];

  return (
    <div className="w-full flex items-center justify-center mb-8">
      <LuxuryCard className="p-6 md:p-8 overflow-hidden bg-gradient-to-br from-blue-500/10 to-black/80 max-w-lg w-full border border-blue-500/20 ">
        <div className="flex flex-col items-center">
          {/* Header */}

          <h3 className="text-xl md:text-2xl font-bold text-blue-400 mb-6 text-center">
            5-Level Referral System
          </h3>

          {/* Levels */}
          <div className="w-full max-w-md mx-auto">
            {levels.map((level, index) => (
              <ReferralLevel
                key={level.level}
                level={level.level}
                title={level.title}
                description={level.description}
                percentage={level.percentage}
                isLast={index === levels.length - 1}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 p-4 bg-black/40 border border-blue-500/20 rounded-lg text-center w-full max-w-md">
            <p className="text-sm text-gray-300">
              Earn{" "}
              <span className="text-blue-400 font-bold">15% in LMX tokens</span>{" "}
              on all purchases made through your 5-level referral network!
            </p>
          </div>
        </div>
      </LuxuryCard>
    </div>
  );
};

export default ReferralSystem;

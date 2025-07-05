import { motion } from "framer-motion";
import ScrollAnimationWrapper from "./ScrollAnimationWrapper";
import { Check, Clock, Calendar, Award } from "lucide-react";

type RoadmapPhase = {
  title: string;
  period: string;
  isCompleted: boolean;
  milestones: {
    text: string;
    isCompleted: boolean;
  }[];
  icon?: React.ReactNode;
};

const RoadmapTimeline: React.FC = () => {
  const roadmapData: RoadmapPhase[] = [
    {
      title: "Seed Phase",
      period: "Q3 2025",
      isCompleted: true,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      milestones: [
        {
          text: "Finalized project vision & ecosystem structure",
          isCompleted: true,
        },
        { text: "Created Litmex Protocol Whitepaper", isCompleted: true },
        {
          text: "Built core team (devs, marketing, community)",
          isCompleted: true,
        },
        { text: "Token smart contract developed on Solana", isCompleted: true },
        { text: "IPFS-hosted whitepaper publicly released", isCompleted: true },
      ],
    },
    {
      title: "Platform Mainnet",
      period: "Q4 2025",
      isCompleted: false,
      icon: <Award className="h-5 w-5 text-primary" />,
      milestones: [
        { text: "Tier 2 listings", isCompleted: false },
        { text: "Major partnerships", isCompleted: false },
        { text: "AI ownership NFT minting", isCompleted: false },
        { text: "Governance DAO", isCompleted: false },
        { text: "MVP build", isCompleted: false },
        { text: "Staking program launch", isCompleted: false },

        { text: "Community engagement & growth", isCompleted: false },
      ],
    },
    {
      title: "Tier 1 Exchange Listing",
      period: "Q1 2026",
      isCompleted: false,
      icon: <Award className="h-5 w-5 text-amber-400" />,
      milestones: [
        {
          text: "Launch 1v1 skill-based games (Rummy, Chess, etc.)",
          isCompleted: false,
        },
        {
          text: "Release Big-ticket lottery system (on-chain, auto-draw, 10% fee)",
          isCompleted: false,
        },
        {
          text: "Launch Prediction Forecast Market (LMX staking to create polls)",
          isCompleted: false,
        },
        {
          text: "Group games added (with P2E reward structure)",
          isCompleted: false,
        },
        {
          text: "Analytics & leaderboard modules integrated",
          isCompleted: false,
        },
      ],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Main timeline container */}
      <div className="relative">
        {/* Timeline phases */}

        {/* Timeline phases */}
        <div className="flex flex-nowrap space-x-4 pb-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-2 md:justify-center">
          {roadmapData.map((phase, index) => (
            <ScrollAnimationWrapper key={phase.title} delay={index * 0.2}>
              <div
                className={`relative snap-center flex-shrink-0 w-[250px] xs:w-[280px] sm:w-[320px] md:w-[350px]`}
              >
                {/* Phase node on timeline */}
                <div className="absolute left-1/2 top-[80px] -translate-x-1/2 z-10">
                  <motion.div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      phase.isCompleted
                        ? "bg-primary border-2 border-primary/70"
                        : "bg-gray-800 border-2 border-gray-600"
                    }`}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {phase.isCompleted && (
                      <Check className="h-3 w-3 text-black" />
                    )}
                  </motion.div>
                </div>

                {/* Timeline labels */}
                <div className="flex flex-col items-center mb-16">
                  <span
                    className={`text-base font-medium ${phase.isCompleted ? "text-primary" : "text-gray-400"}`}
                  >
                    {phase.period}
                  </span>
                  <h3
                    className={`text-xl font-bold mt-1 ${phase.isCompleted ? "text-primary" : "text-white"}`}
                  >
                    {phase.title}
                  </h3>
                </div>

                {/* Content card */}
                <div
                  className={`mt-12 bg-black/40 backdrop-blur-sm border mt-2 ${
                    phase.isCompleted ? "border-primary/30" : "border-white/10"
                  } rounded-lg p-5 relative group hover:border-primary/50 transition-all min-h-[280px]`}
                >
                  {/* Icon */}
                  <div
                    className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
                      phase.isCompleted ? "bg-primary/20" : "bg-white/5"
                    } border ${phase.isCompleted ? "border-primary/30" : "border-white/10"} mt-2`}
                  >
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      {phase.icon ||
                        (phase.isCompleted ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        ))}
                    </motion.div>
                  </div>

                  {/* Milestones */}
                  <ul className="space-y-3 mt-4">
                    {phase.milestones.map((milestone, i) => (
                      <li key={i} className="flex items-start gap-2 group">
                        <span
                          className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center mt-0.5 ${
                            milestone.isCompleted
                              ? "bg-primary/20 text-primary border-primary/30"
                              : "bg-white/5 text-gray-400 border-white/10"
                          } border`}
                        >
                          {milestone.isCompleted ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                          )}
                        </span>
                        <span
                          className={`text-xs sm:text-sm ${
                            milestone.isCompleted
                              ? "text-white"
                              : "text-gray-300"
                          } transition-all duration-300 group-hover:text-primary`}
                        >
                          {milestone.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapTimeline;

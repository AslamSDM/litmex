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
        {/* Horizontal timeline for desktop, vertical for mobile */}

        {/* Timeline phases - horizontal for md+ screens, vertical for mobile */}
        <div className="flex md:flex-row flex-col md:space-x-4 space-y-10 md:space-y-0 pb-8 md:overflow-x-auto overflow-visible md:snap-x md:snap-mandatory scrollbar-hide px-4 md:px-2 md:justify-center">
          {roadmapData.map((phase, index) => (
            <ScrollAnimationWrapper key={phase.title} delay={index * 0.2}>
              <div
                className={`relative md:snap-center flex-shrink-0 md:w-[250px] md:xs:w-[280px] md:sm:w-[320px] md:w-[350px] w-full`}
              >
                {/* Vertical connecting line for mobile */}
                {index < roadmapData.length - 1 && (
                  <div className="absolute md:hidden left-[20px] top-[110px] w-[2px] h-[40px] bg-gradient-to-b from-primary/50 to-primary/20" />
                )}

                {/* Phase node - on horizontal timeline for desktop, at left for mobile */}
                <div
                  className={`absolute md:left-1/2 left-[20px] md:top-[80px] top-[64px] md:-translate-x-1/2 z-10`}
                >
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

                {/* Timeline labels - centered for desktop, left-aligned with indent for mobile */}
                <div className="flex flex-col md:items-center mb-16 md:mb-16 ml-12 md:ml-0">
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

                {/* Content card - positioned below for desktop, indented for mobile */}
                <div
                  className={`md:mt-12 bg-black/40 backdrop-blur-sm border mt-2 ${
                    phase.isCompleted ? "border-primary/30" : "border-white/10"
                  } rounded-lg p-5 relative group hover:border-primary/50 transition-all min-h-[240px] md:min-h-[280px] ml-12 md:ml-0`}
                >
                  {/* Icon - centered on top for desktop, top-left for mobile */}
                  <div
                    className={`absolute md:-top-5 -top-4 md:left-1/2 left-0 md:-translate-x-1/2 md:translate-y-0 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
                      phase.isCompleted ? "bg-primary/20" : "bg-white/5"
                    } border ${phase.isCompleted ? "border-primary/30" : "border-white/10"}`}
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

      {/* Scroll hint - only for desktop since mobile uses vertical layout */}
      <div className="hidden md:flex text-center text-xs text-gray-400 mt-2 mb-4 items-center justify-center">
        <motion.div
          animate={{ x: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mr-2"
        >
          ←
        </motion.div>
        Scroll to view more
        <motion.div
          animate={{ x: [5, -5, 5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="ml-2"
        >
          →
        </motion.div>
      </div>

      {/* Decorative Element */}
      <motion.div
        className="w-full flex justify-center mt-4"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </motion.div>
    </div>
  );
};

export default RoadmapTimeline;

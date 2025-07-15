"use client";

import React, { useState, useEffect } from "react";
import { TimerIcon } from "lucide-react";
import { DecorativeIcon } from "./DecorativeElements";

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeBoxes = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className={`${className}`}>
      <div className="flex items-center mb-4">
        <TimerIcon className="text-primary w-5 h-5 mr-2" />
        <h3 className="text-xl font-medium">Presale Ends In</h3>
      </div>

      <div className="flex justify-between gap-2 md:gap-4">
        {timeBoxes.map((box, index) => (
          <div key={index} className="flex-1">
            <div className="bg-black/40 border border-primary/30 rounded-md p-2 md:p-4 text-center luxury-time-box">
              <div className="text-xl md:text-3xl font-bold font-mono">
                {String(box.value).padStart(2, "0")}
              </div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">
                {box.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;

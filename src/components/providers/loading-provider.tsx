"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  startLoading: () => void;
  setProgress: (value: number) => void;
  completeLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true); // Start true for initial page load
  const [progress, setProgress] = useState(0);

  // Refs for timers
  const initialProgressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackCompleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeLoadingDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressSim1Ref = useRef<NodeJS.Timeout | null>(null);
  const progressSim2Ref = useRef<NodeJS.Timeout | null>(null);
  const progressSim3Ref = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null); // Added watchdog timer ref

  const clearWatchdog = () => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  const clearAllLoadingTimers = () => {
    if (initialProgressTimerRef.current)
      clearTimeout(initialProgressTimerRef.current);
    if (fallbackCompleteTimerRef.current)
      clearTimeout(fallbackCompleteTimerRef.current);
    if (completeLoadingDelayTimerRef.current)
      clearTimeout(completeLoadingDelayTimerRef.current);
    if (progressSim1Ref.current) clearTimeout(progressSim1Ref.current);
    if (progressSim2Ref.current) clearTimeout(progressSim2Ref.current);
    if (progressSim3Ref.current) clearTimeout(progressSim3Ref.current);
    clearWatchdog(); // Clear watchdog timer as well

    initialProgressTimerRef.current = null;
    fallbackCompleteTimerRef.current = null;
    completeLoadingDelayTimerRef.current = null;
    progressSim1Ref.current = null;
    progressSim2Ref.current = null;
    progressSim3Ref.current = null;
  };

  const startLoading = () => {
    clearAllLoadingTimers(); // Clear any pending timers from previous load cycles.

    // setIsLoading(true);
    setProgress(0.1); // Reset progress for the new loading sequence

    // Simulate progress, ensuring progress only moves forward if still loading.
    progressSim1Ref.current = setTimeout(() => {
      if (isLoading) setProgress((p) => Math.max(p, 0.3));
    }, 100);
    progressSim2Ref.current = setTimeout(() => {
      if (isLoading) setProgress((p) => Math.max(p, 0.5));
    }, 300);
    progressSim3Ref.current = setTimeout(() => {
      if (isLoading) setProgress((p) => Math.max(p, 0.7));
    }, 600);

    // Set a watchdog timer to force completion if it gets stuck
    watchdogTimerRef.current = setTimeout(() => {
      if (isLoading) {
        // console.warn("LoadingProvider: Watchdog triggered. Forcing loading to complete.");
        setProgress(1);
        setIsLoading(false); // Directly set isLoading to false
      }
    }, 400); // Watchdog timeout (e.g., 4 seconds)
  };

  const completeLoading = () => {
    clearWatchdog(); // Clear the watchdog timer as we are now completing

    // Clear any running progress simulation timers from startLoading
    if (progressSim1Ref.current) clearTimeout(progressSim1Ref.current);
    if (progressSim2Ref.current) clearTimeout(progressSim2Ref.current);
    if (progressSim3Ref.current) clearTimeout(progressSim3Ref.current);
    progressSim1Ref.current = null;
    progressSim2Ref.current = null;
    progressSim3Ref.current = null;

    // Clear any pending completeLoadingDelayTimer from a previous call to completeLoading
    if (completeLoadingDelayTimerRef.current) {
      clearTimeout(completeLoadingDelayTimerRef.current);
    }

    setProgress(1); // Set progress to 100%

    // Delay hiding the loader for a smooth transition
    completeLoadingDelayTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      completeLoadingDelayTimerRef.current = null; // Clear ref after execution
    }, 300); // Adjusted delay for a slightly quicker transition
  };

  // Effect for initial page load simulation and fallback
  useEffect(() => {
    setIsLoading(true);
    setProgress(0.1);

    initialProgressTimerRef.current = setTimeout(() => {
      if (isLoading && progress < 0.5) {
        setProgress(0.5);
      }
    }, 300);

    fallbackCompleteTimerRef.current = setTimeout(() => {
      if (isLoading) {
        completeLoading();
      }
    }, 1000); // Fallback to complete loading after 3 seconds

    return () => {
      // Cleanup all timers when the provider unmounts
      clearAllLoadingTimers();
    };
  }, []); // Runs only on mount and unmount
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        setIsLoading(false);
      }, 100); // Simulate loading for 1 second on mount
    }
  }, [isLoading]);

  const value = {
    isLoading,
    progress,
    startLoading,
    setProgress, // Allow external direct manipulation of progress
    completeLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

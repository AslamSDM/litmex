import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { extractReferralCodeFromUrl } from "@/lib/referral";
import { getCookie } from "@/lib/cookies";
import { useSession } from "next-auth/react";

interface ReferralInfo {
  code: string | null;
  referrerId: string | null;
  referrerAddress: string | null;
  referrerUsername: string | null;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  wallet: boolean;
}

interface ReferralResponse {
  success: boolean;
  referrerId: string;
  walletAddress?: string;
  username?: string;
  error?: string;
}

interface ReferralState {
  referralCode: string | null;
  wallet: boolean;
  referrerId: string | null;
  referrerAddress: string | null;
  referrerUsername: string | null;
  isValid: boolean;
  lastUpdated: number;
  processedCodes: string[];
  failedCodes: Set<string>;
}

interface ReferralActions {
  setReferralCode: (code: string) => void;
  setReferralData: (data: {
    referrerId: string;
    referrerAddress?: string;
    referrerUsername?: string;
    isValid: boolean;
  }) => void;
  setWallet: (wallet: boolean) => void;
  markCodeAsProcessed: (code: string) => void;
  markCodeAsFailed: (code: string) => void;
  isCodeProcessed: (code: string) => boolean;
  isCodeFailed: (code: string) => boolean;
  clearReferralData: () => void;
  resetFailedCodes: () => void;
}

type ReferralStore = ReferralState & ReferralActions;

// Create Zustand store with persistence
export const useReferralStore = create<ReferralStore>()(
  persist(
    (set, get) => ({
      wallet: false,
      // Initial state
      referralCode: null,
      referrerId: null,
      referrerAddress: null,
      referrerUsername: null,
      isValid: false,
      lastUpdated: 0,
      processedCodes: [],
      failedCodes: new Set(),

      // Actions
      setReferralCode: (code: string | null) =>
        set((state) => ({
          referralCode: code,
          lastUpdated: Date.now(),
        })),
      setWallet: (wallet: boolean) =>
        set((state) => ({
          wallet: wallet,
        })),

      setReferralData: (data) =>
        set((state) => ({
          referrerId: data.referrerId,
          referrerAddress: data.referrerAddress || null,
          referrerUsername: data.referrerUsername || null,
          isValid: data.isValid,
          lastUpdated: Date.now(),
        })),

      markCodeAsProcessed: (code: string) =>
        set((state) => ({
          processedCodes: [...new Set([...state.processedCodes, code])],
        })),

      markCodeAsFailed: (code: string) =>
        set((state) => ({
          failedCodes: new Set([...state.failedCodes, code]),
        })),

      isCodeProcessed: (code: string) => {
        const state = get();
        return state.processedCodes.includes(code);
      },

      isCodeFailed: (code: string) => {
        const state = get();
        return state.failedCodes.has(code);
      },

      resetFailedCodes: () =>
        set((state) => ({
          failedCodes: new Set(),
        })),

      clearReferralData: () =>
        set({
          referralCode: null,
          referrerId: null,
          referrerAddress: null,
          referrerUsername: null,
          isValid: false,
          lastUpdated: 0,
          processedCodes: [],
          failedCodes: new Set(),
        }),
    }),
    {
      name: "referral-storage",
      version: 1, // Add versioning for future migrations
      storage: createJSONStorage(() => {
        // Custom storage with fallback for iOS
        const storage = {
          getItem: (key: string): string | null => {
            try {
              // Try localStorage first
              if (typeof window !== "undefined" && window.localStorage) {
                return localStorage.getItem(key);
              }
              // Fallback to sessionStorage for iOS private mode
              if (typeof window !== "undefined" && window.sessionStorage) {
                return sessionStorage.getItem(key);
              }
            } catch (error) {
              console.warn("Storage access failed:", error);
            }
            return null;
          },
          setItem: (key: string, value: string): void => {
            try {
              if (typeof window !== "undefined" && window.localStorage) {
                localStorage.setItem(key, value);
              } else if (
                typeof window !== "undefined" &&
                window.sessionStorage
              ) {
                sessionStorage.setItem(key, value);
              }
            } catch (error) {
              console.warn("Storage write failed:", error);
            }
          },
          removeItem: (key: string): void => {
            try {
              if (typeof window !== "undefined" && window.localStorage) {
                localStorage.removeItem(key);
              } else if (
                typeof window !== "undefined" &&
                window.sessionStorage
              ) {
                sessionStorage.removeItem(key);
              }
            } catch (error) {
              console.warn("Storage removal failed:", error);
            }
          },
        };
        return storage;
      }),
      // Partition key for better iOS compatibility
      partialize: (state) => ({
        referralCode: state.referralCode,
        referrerId: state.referrerId,
        referrerAddress: state.referrerAddress,
        referrerUsername: state.referrerUsername,
        isValid: state.isValid,
        lastUpdated: state.lastUpdated,
        processedCodes: state.processedCodes,
        failedCodes: Array.from(state.failedCodes), // Convert Set to Array for serialization
        wallet: state.wallet,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.failedCodes)) {
          // Convert Array back to Set after rehydration
          state.failedCodes = new Set(state.failedCodes);
        }
      },
    }
  )
);

// Constants
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility function for exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hook to handle referral code processing from URL using Zustand store
 * @param wallet - Optional wallet parameter from URL
 * @param isWallet - Flag to indicate if user is in wallet mode
 * @returns Object containing referral state and methods
 */
export default function useReferralHandling(): ReferralInfo {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Zustand store selectors
  const {
    referralCode,
    referrerId,
    referrerAddress,
    referrerUsername,
    isValid,
    lastUpdated,
    setReferralCode,
    setReferralData,
    markCodeAsProcessed,
    markCodeAsFailed,
    isCodeFailed,
    resetFailedCodes,
    setWallet,
    wallet,
  } = useReferralStore();
  console.log(referralCode, "Referral Code from store");

  // Initialize client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Wallet detection logic
  const getWalletInfo = useCallback(() => {
    if (!isClient) return { walletFromUrl: null, isWallet: false };

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const walletFromUrl = urlParams.get("wallet");

      const isWallet = walletFromUrl === "true";

      return { walletFromUrl, isWallet };
    } catch (error) {
      console.warn("Error detecting wallet info:", error);
      return { walletFromUrl: null, isWallet: false };
    }
  }, [isClient]);

  // Handle wallet state updates
  useEffect(() => {
    const { isWallet } = getWalletInfo();
    if (isWallet) {
      // Only update wallet state if not already in wallet browser
      setWallet(true);
    }
  }, [isClient, getWalletInfo, setWallet]);

  // Get referral code from URL with validation
  const getCurrentReferralCode = useCallback((): string | null => {
    if (!isClient) return null;

    try {
      // First try URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      console.log(referralCode, "Referral Code from url");
      const code = urlParams.get("referral") || referralCode;

      // Basic validation
      if (code) {
        return code;
      }

      return null;
    } catch (error) {
      console.warn("Error extracting referral code from URL:", error);
      setError("Failed to extract referral code from URL");
      return null;
    }
  }, [isClient]);

  // Handle referral API success
  const handleReferralSuccess = useCallback(
    (data: ReferralResponse, code: string) => {
      // setReferralData({
      //   referrerId: data.referrerId,
      //   referrerAddress: data.walletAddress,
      //   referrerUsername: data.username,
      //   isValid: true,
      // });
      setReferralCode("");
      markCodeAsProcessed(code);
      retryCountRef.current.delete(code);
      setError(null);

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `Referral code validated: ${code}, Referrer: ${data.username || data.referrerId}`
        );
      }
    },
    [setReferralData, markCodeAsProcessed]
  );

  // Handle referral API failure
  const handleReferralFailure = useCallback(
    (code: string, errorMessage?: string) => {
      // setReferralData({
      //   referrerId: "",
      //   isValid: false,
      // });

      markCodeAsFailed(code);
      retryCountRef.current.delete(code);
      setError(errorMessage || "Invalid referral code");

      if (process.env.NODE_ENV !== "production") {
        console.warn(`Invalid referral code: ${code}`, errorMessage);
      }
    },
    [setReferralData, markCodeAsFailed]
  );

  // API call with retry logic
  const fetchReferralInfo = async (
    code: string,
    attempt: number = 1
  ): Promise<ReferralResponse> => {
    try {
      console.log("Fetching referral info for code:", code);
      const response = await fetch(
        `/api/referral/info?code=${encodeURIComponent(code)}`,
        {
          headers: {
            "Cache-Control": "max-age=3600",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ReferralResponse = await response.json();
      return data;
    } catch (error) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Retry logic for network errors
      if (
        attempt < MAX_RETRY_ATTEMPTS &&
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("network"))
      ) {
        await delay(RETRY_DELAY * attempt); // Exponential backoff
        return fetchReferralInfo(code, attempt + 1);
      }

      throw error;
    }
  };

  // Process referral code with enhanced error handling
  const processReferralCode = useCallback(
    async (code: string) => {
      if (!code || isLoading) return;
      console.log("Processing referral code:", code, "Loading:", isLoading);

      setIsLoading(true);
      setError(null);
      try {
        // Store the code
        setReferralCode(code);

        // Wait for authentication
        console.log(status);
        if (status !== "authenticated") {
          setIsLoading(false);
          return;
        }

        console.log("Fetching referral info for code:", code);
        const response = await fetch(
          `/api/referral/info?code=${encodeURIComponent(code)}`,
          {
            headers: {
              "Cache-Control": "max-age=3600",
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ReferralResponse = await response.json();
        // Check if we have recent valid data for this code

        // Fetch referrer details from API

        if (data.success) {
          handleReferralSuccess(data, code);
        } else {
          handleReferralFailure(code, data.error);
        }
      } catch (error) {
        const retryCount = retryCountRef.current.get(code) || 0;
        retryCountRef.current.set(code, retryCount + 1);

        let errorMessage = "Failed to validate referral code";

        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Request timed out. Please check your connection.";
          } else if (error.message.includes("network")) {
            errorMessage = "Network error. Please try again.";
          }
        }

        handleReferralFailure(code, errorMessage);

        if (process.env.NODE_ENV !== "production") {
          console.error("Error handling referral code:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      status,
      isLoading,
      isCodeFailed,
      setReferralCode,
      referralCode,
      isValid,
      lastUpdated,
      handleReferralSuccess,
      handleReferralFailure,
      markCodeAsProcessed,
      fetchReferralInfo,
    ]
  );

  // Process URL referral code when available
  useEffect(() => {
    const code = getCurrentReferralCode();
    if (!code) return;
    processReferralCode(code);
  }, [isClient, status]);

  // Handle wallet-specific logic

  // Reset failed codes periodically (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      resetFailedCodes();
      retryCountRef.current.clear();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [resetFailedCodes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoize return value
  const referralInfo = useMemo(
    () => ({
      code: referralCode,
      referrerId,
      referrerAddress,
      referrerUsername,
      isValid,
      isLoading,
      error,
      wallet,
    }),
    [
      referralCode,
      referrerId,
      referrerAddress,
      referrerUsername,
      isValid,
      isLoading,
      error,
      wallet,
    ]
  );

  return referralInfo;
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { extractReferralCodeFromUrl } from "@/lib/referral";
import { setCookie, getCookie } from "@/lib/cookies";
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
      setReferralCode: (code: string) =>
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
    isCodeProcessed,
    isCodeFailed,
    resetFailedCodes,
    setWallet,
    wallet,
  } = useReferralStore();

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
      const referrerCode =
        urlParams.get("referral") || getCookie("referralCode");

      // Fallback to extractReferralCodeFromUrl if no URL param
      const code = referrerCode || extractReferralCodeFromUrl();

      // Basic validation
      if (code) {
        // Check for minimum length and basic format
        if (code.length < 3 || code.length > 50) {
          console.warn("Invalid referral code format:", code);
          return null;
        }

        // Sanitize code (remove potentially harmful characters)
        const sanitizedCode = code.replace(/[^a-zA-Z0-9_-]/g, "");
        if (sanitizedCode !== code) {
          console.warn("Referral code contained invalid characters");
          return sanitizedCode;
        }

        return code;
      }

      return null;
    } catch (error) {
      console.warn("Error extracting referral code from URL:", error);
      setError("Failed to extract referral code from URL");
      return null;
    }
  }, [isClient]);

  // Memoized current referral code from URL
  const urlReferralCode = useMemo(() => {
    return getCurrentReferralCode();
  }, [getCurrentReferralCode]);

  // Handle referral API success
  const handleReferralSuccess = useCallback(
    (data: ReferralResponse, code: string) => {
      setReferralData({
        referrerId: data.referrerId,
        referrerAddress: data.walletAddress,
        referrerUsername: data.username,
        isValid: true,
      });

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
      setReferralData({
        referrerId: "",
        isValid: false,
      });

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
  const fetchReferralInfo = useCallback(
    async (code: string, attempt: number = 1): Promise<ReferralResponse> => {
      const controller = new AbortController();

      // Set timeout for mobile networks
      timeoutRef.current = setTimeout(() => {
        controller.abort();
      }, API_TIMEOUT);

      try {
        const response = await fetch(
          `/api/referral/info?code=${encodeURIComponent(code)}`,
          {
            headers: {
              "Cache-Control": "max-age=3600",
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

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
    },
    []
  );

  // Process referral code with enhanced error handling
  const processReferralCode = useCallback(
    async (code: string) => {
      if (!code || isLoading) return;

      // Skip if already processed or failed recently
      if (isCodeProcessed(code)) return;

      // Check if code failed recently (implement basic rate limiting)
      if (isCodeFailed(code)) {
        const retryCount = retryCountRef.current.get(code) || 0;
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          setError("Referral code validation failed. Please try again later.");
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        // Store the code
        setReferralCode(code);

        // Wait for authentication
        if (status !== "authenticated") {
          setIsLoading(false);
          return;
        }

        // Check if we have recent valid data for this code
        const now = Date.now();
        const isRecentData = now - lastUpdated < CACHE_DURATION;

        if (referralCode === code && isValid && isRecentData) {
          // Use cached data
          markCodeAsProcessed(code);
          setIsLoading(false);
          return;
        }

        // Fetch referrer details from API
        const data = await fetchReferralInfo(code);

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
      isCodeProcessed,
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
    if (urlReferralCode && isClient) {
      processReferralCode(urlReferralCode);
    }
  }, [urlReferralCode, isClient, processReferralCode]);

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

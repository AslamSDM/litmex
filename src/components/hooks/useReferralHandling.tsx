import { useState, useEffect, useCallback, useMemo } from "react";
import { extractReferralCodeFromUrl } from "@/lib/referral";
import { setCookie, getCookie } from "@/lib/cookies";
import { useSession } from "next-auth/react";

interface ReferralInfo {
  code: string | null;
  referrerId: string | null;
  referrerAddress: string | null;
  referrerUsername: string | null;
  isValid: boolean;
}

/**
 * Hook to handle referral code processing from URL and store in cookies
 * @returns Object containing referral state and methods
 */
export default function useReferralHandling(): ReferralInfo {
  // Detect iOS for memory optimizations
  const [isIOS, setIsIOS] = useState<boolean>(false);

  // Use lazy initial state to avoid unnecessary calculations on render
  const [referralCode, setReferralCode] = useState<string | null>(() => null);
  const [referrerId, setReferrerId] = useState<string | null>(() => null);
  const [referrerAddress, setReferrerAddress] = useState<string | null>(
    () => null
  );
  const [referrerUsername, setReferrerUsername] = useState<string | null>(
    () => null
  );
  const [isValid, setIsValid] = useState<boolean>(() => false);

  const { status, data: session } = useSession();

  // Memoize cookie referral code to prevent unnecessary recalculation
  const cookieRefCode = useMemo(() => {
    if (typeof window === "undefined") return null;
    return extractReferralCodeFromUrl() || getCookie("referralCode");
  }, []);

  // Check for iOS device once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    }
  }, []);

  // Define type for referral API response
  interface ReferralResponse {
    success: boolean;
    referrerId: string;
    walletAddress?: string;
    username?: string;
  }

  // Define type for cookie data
  interface CookieData {
    [key: string]: string;
  }

  // Memoized function to handle API responses and state updates
  const handleReferralSuccess = useCallback(
    (data: ReferralResponse, code: string) => {
      setReferrerId(data.referrerId);
      setReferrerAddress(data.walletAddress || null);
      setReferrerUsername(data.username || null);
      setIsValid(true);

      // Store in cookies - batch cookie operations
      const cookieData: CookieData = {
        referrerId: data.referrerId,
        referralIsValid: "true",
      };

      // Only set these cookies if the values exist
      if (data.walletAddress) cookieData.referrerAddress = data.walletAddress;
      if (data.username) cookieData.referrerUsername = data.username;

      // Set cookies
      Object.entries(cookieData).forEach(([key, value]) => {
        setCookie(key, value as string, 30);
      });

      if (process.env.NODE_ENV !== "production") {
        console.log(
          `Referral code validated: ${code}, Referrer: ${data.username || data.referrerId}`
        );
      }
    },
    []
  );

  // Memoized function to handle referral failures
  const handleReferralFailure = useCallback((code: string) => {
    setIsValid(false);
    setCookie("referralIsValid", "false", 30);

    if (process.env.NODE_ENV !== "production") {
      console.warn(`Invalid referral code: ${code}`);
    }
  }, []);

  // Process referral code with useCallback
  const processReferralCode = useCallback(
    async (code: string) => {
      try {
        // If no code in URL, check if we already have one in cookies
        const savedCode = getCookie("referralCode");
        if (!savedCode || savedCode !== code) {
          setCookie("referralCode", code);
        }

        if (status !== "authenticated") return;

        // Skip unnecessary API calls if we already validated this code
        const isValidFromCookie = savedCode !== code;
        const storedReferrerId = getCookie("referrerId");

        // If we already validated this code and have the data stored, use the cached version
        // This reduces API calls, especially important on iOS devices
        if (isValidFromCookie && storedReferrerId && isIOS) {
          setIsValid(true);
          setReferrerId(storedReferrerId);
          setReferrerAddress(getCookie("referrerAddress") || null);
          setReferrerUsername(getCookie("referrerUsername") || null);
          return;
        }

        // Fetch referrer details from API
        try {
          const response = await fetch(`/api/referral/info?code=${code}`, {
            // Add cache control headers to improve performance
            headers: {
              "Cache-Control": "max-age=3600", // Cache for an hour
            },
          });
          const data = await response.json();

          if (data.success) {
            handleReferralSuccess(data, code);
          } else {
            handleReferralFailure(code);
          }
        } catch (error) {
          handleReferralFailure(code);
          if (process.env.NODE_ENV !== "production") {
            console.error("Error fetching referrer info:", error);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error handling referral code:", error);
        }
      }
    },
    [status, handleReferralSuccess, handleReferralFailure]
  );

  // Effect to process referral code when available
  useEffect(() => {
    if (cookieRefCode && typeof window !== "undefined") {
      processReferralCode(cookieRefCode);
    }
  }, [cookieRefCode, processReferralCode]);

  // Memoize return value to prevent unnecessary object recreation
  const referralInfo = useMemo(
    () => ({
      code: referralCode,
      referrerId,
      referrerAddress,
      referrerUsername,
      isValid,
    }),
    [referralCode, referrerId, referrerAddress, referrerUsername, isValid]
  );

  return referralInfo;
}

import { useState, useEffect } from "react";
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);
  const [referrerUsername, setReferrerUsername] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const { status, data: session } = useSession();
  const cookieRefCode =
    extractReferralCodeFromUrl() || getCookie("referralCode");

  // Check for referral code in URL and process it
  useEffect(() => {
    console.log("useReferralHandling mounted", status, session);
    const processReferralCode = async (code: string) => {
      try {
        console.log(status);
        // Extract referral code from URL
        console.log("Processing referral code:", code);
        // If no code in URL, check if we already have one in cookies
        const savedCode = getCookie("referralCode");
        console.log("Saved referral code from cookies:", savedCode);
        if (!savedCode || savedCode !== code) {
          setCookie("referralCode", code);
        }
        console.log("Referral code from URL:", code);
        if (status !== "authenticated") return;
        // Fetch referrer details from API
        try {
          const response = await fetch(`/api/referral/info?code=${code}`);
          const data = await response.json();
          console.log("Referral info response:", data);
          if (data.success) {
            setReferrerId(data.referrerId);
            setReferrerAddress(data.walletAddress);
            setReferrerUsername(data.username);
            setIsValid(true);

            // Store in cookies
            setCookie("referrerId", data.referrerId, 30);
            if (data.walletAddress)
              setCookie("referrerAddress", data.walletAddress, 30);
            if (data.username) setCookie("referrerUsername", data.username, 30);
            setCookie("referralIsValid", "true", 30);

            console.log(
              `Referral code validated: ${code}, Referrer: ${
                data.username || data.referrerId
              }`
            );
          } else {
            setIsValid(false);
            setCookie("referralIsValid", "false", 30);
            console.warn(`Invalid referral code in URL: ${code}`);
          }
        } catch (error) {
          console.error("Error fetching referrer info:", error);
          setIsValid(false);
          setCookie("referralIsValid", "false", 30);
        }
      } catch (error) {
        console.error("Error handling referral code:", error);
      }
    };
    console.log("Cookie referral code:", cookieRefCode);
    if (cookieRefCode) {
      processReferralCode(cookieRefCode);
    }
    // Only process referral in browser environment
  }, [cookieRefCode, session, status]);

  return {
    code: referralCode,
    referrerId,
    referrerAddress,
    referrerUsername,
    isValid,
  };
}

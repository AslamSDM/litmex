// Referral system utilities
import {
  generateUniqueReferralCode,
  validateReferralCode,
} from "./referral-utils";

/**
 * Generates a referral URL with the given referral code
 * @param referralCode The user's referral code
 * @returns A complete referral URL
 */
export function generateReferralUrl(referralCode: string): string {
  // Use the absolute URL constructor to ensure proper URL formatting
  // Add the referral code as a query parameter
  return `${
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  }?ref=${referralCode}`;
}

/**
 * Extracts the referral code from the URL if present
 * @returns The referral code from the URL or null if not found
 */
export function extractReferralCodeFromUrl(): string | null {
  // Only run in browser environment
  if (typeof window === "undefined") return null;

  // Get the 'ref' query parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get("ref");
  return referralCode;
}

/**
 * Stores the referral code in localStorage for later use
 * @param referralCode The referral code to store
 */
export function storeReferralCode(referralCode: string): void {
  // Only run in browser environment
  if (typeof window === "undefined") return;

  // Store the referral code in localStorage
  localStorage.setItem("referralCode", referralCode);
}

/**
 * Retrieves the stored referral code from localStorage
 * @returns The stored referral code or null if not found
 */
export function getStoredReferralCode(): string | null {
  // Only run in browser environment
  if (typeof window === "undefined") return null;

  // Get the referral code from localStorage
  return localStorage.getItem("referralCode");
}

/**
 * Clears the stored referral code from localStorage
 */
export function clearStoredReferralCode(): void {
  // Only run in browser environment
  if (typeof window === "undefined") return;

  // Remove the referral code from localStorage
  localStorage.removeItem("referralCode");
}

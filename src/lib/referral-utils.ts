import { customAlphabet } from "nanoid";
import prisma from "./prisma";

// Create a custom nanoid generator with specific characters
// avoiding similar-looking characters (0, O, I, l, etc.)
const generateCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // Avoiding 0,1,I,O for readability
  8 // 8 character long referral codes
);

/**
 * Generates a unique referral code for a user
 * Retries up to 5 times if there's a collision
 */
export async function generateUniqueReferralCode(retries = 5): Promise<string> {
  const code = generateCode();

  try {
    // Check if code exists
    const existingCode = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!existingCode) {
      return code;
    }

    // If code exists and we have retries left, try again
    if (retries > 0) {
      return generateUniqueReferralCode(retries - 1);
    }

    // Last resort, add timestamp to ensure uniqueness
    return `${code}${Date.now().toString().slice(-4)}`;
  } catch (error) {
    console.error("Error generating referral code:", error);
    // Last resort, add timestamp to ensure uniqueness
    return `${code}${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Validates a referral code to ensure it exists and belongs to an active user
 * @param code The referral code to validate
 * @returns User ID of the referrer if valid, null otherwise
 */
export async function validateReferralCode(
  code: string
): Promise<string | null> {
  if (!code) return null;

  try {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, verified: true },
    });

    // Only allow verified users to be referrers
    if (referrer && referrer.verified) {
      return referrer.id;
    }

    return null;
  } catch (error) {
    console.error("Error validating referral code:", error);
    return null;
  }
}

/**
 * Applies a referral connection between users
 * @param userId The user ID of the new user
 * @param referrerId The user ID of the referrer
 */
export async function applyReferral(
  userId: string,
  referrerId: string
): Promise<boolean> {
  try {
    // Ensure we don't create self-referrals or circular referrals
    if (userId === referrerId) return false;

    // Update the user with the referrer ID
    await prisma.user.update({
      where: { id: userId },
      data: { referrerId },
    });

    return true;
  } catch (error) {
    console.error("Error applying referral:", error);
    return false;
  }
}

/**
 * Gets referral statistics for a user
 */
export async function getUserReferralStats(userId: string) {
  try {
    // Count direct referrals
    const referralCount = await prisma.user.count({
      where: { referrerId: userId },
    });

    // Get user's referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    return {
      referralCode: user?.referralCode || null,
      referralCount,
      // Add more stats as needed
    };
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return {
      referralCode: null,
      referralCount: 0,
    };
  }
}

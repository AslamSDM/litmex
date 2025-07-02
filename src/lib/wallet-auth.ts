import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

/**
 * Creates a message to be signed by the wallet
 * @param walletAddress The wallet address requesting the referral
 * @returns A message string to be signed
 */
export function createSignMessage(walletAddress: string): string {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);

  return `Sign this message to verify your wallet ownership and generate your ltmex referral code.

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}

This signature will not trigger any blockchain transaction or incur any fees.`;
}

/**
 * Verifies a signature against a public key and message
 * @param signature The signature as a base58 encoded string
 * @param message The original message that was signed
 * @param publicKey The public key that supposedly signed the message
 * @returns Boolean indicating if the signature is valid
 */
export function verifySignature(
  signature: string,
  message: string,
  publicKey: string
): boolean {
  try {
    // Convert the signature from base58 to Uint8Array
    const signatureBytes = bs58.decode(signature);

    // Convert the public key from string to PublicKey and then to bytes
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    // Convert the message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // Verify the signature
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Extracts the timestamp from a signed message
 * @param message The message that was signed
 * @returns The timestamp in milliseconds, or null if not found
 */
export function extractTimestampFromMessage(message: string): number | null {
  const timestampMatch = message.match(/Timestamp: (\d+)/);
  if (timestampMatch && timestampMatch[1]) {
    return parseInt(timestampMatch[1], 10);
  }
  return null;
}

/**
 * Checks if a signature has expired
 * @param message The message that was signed
 * @param maxAgeMs Maximum age of the signature in milliseconds
 * @returns Boolean indicating if the signature has expired
 */
export function isSignatureExpired(
  message: string,
  maxAgeMs = 5 * 60 * 1000
): boolean {
  const timestamp = extractTimestampFromMessage(message);
  if (!timestamp) return true;

  const currentTime = Date.now();
  return currentTime - timestamp > maxAgeMs;
}

/**
 * Connects referral code generation to wallet verification
 * This ensures that only verified wallet owners can generate referral codes
 * @param walletAddress The wallet address (public key as string)
 * @param signature The signature as a base58 encoded string
 * @param message The original message that was signed
 * @returns Boolean indicating if the verification was successful
 */
export function verifyWalletForReferral(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  // Check if signature is expired (5 minutes max)
  if (isSignatureExpired(message)) {
    return false;
  }

  return verifySignature(signature, message, walletAddress);
}

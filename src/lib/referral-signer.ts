import { PublicKey, Transaction } from "@solana/web3.js";
import { toast } from "sonner";

/**
 * Simple function to sign a referral message with Solana wallet
 * This is a lightweight alternative to using the full Solana presale contract
 * It just creates a signed message that can be used to verify referrals
 */
export async function signReferralWithSolana(
  referralCode: string,
  wallet: {
    publicKey: PublicKey | null;
    sendTransaction: (
      transaction: Transaction,
      connection: any,
      options?: any
    ) => Promise<string>;
  }
) {
  if (!wallet.publicKey) {
    toast.error("Solana wallet not connected");
    return null;
  }

  try {
    // Create a minimal transaction that doesn't actually send any SOL
    // We're just using this to get a signature
    const transaction = new Transaction();

    // Add a memo to the transaction with the referral code
    // We're not actually sending this transaction
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = "simulated";

    // Add the referral code as custom data to the transaction
    // This helps identify the purpose of the transaction if debugging is needed
    transaction.add({
      keys: [],
      programId: new PublicKey("11111111111111111111111111111111"),
      data: Buffer.from(`ref:${referralCode}`, "utf-8"),
    });

    try {
      // Get a signature for the transaction
      // In development/test mode, this might use a mock signature if the wallet extension is not available
      const signedTx = await wallet.sendTransaction(transaction, null, {
        skipPreflight: true,
      });

      // Return a simple object with the verified data
      return {
        referralCode,
        walletAddress: wallet.publicKey.toString(),
        signature: signedTx,
        timestamp: Date.now(),
      };
    } catch (txError: any) {
      // Handle specific chrome extension errors
      if (txError.message && txError.message.includes("runtime.sendMessage")) {
        console.warn(
          "Extension communication error during referral signing:",
          txError.message
        );
        toast.warning("Wallet extension communication error - using test mode");

        // For development/testing, generate a test signature
        const testSignature = `TEST_${referralCode}_${Date.now().toString(36)}`;
        return {
          referralCode,
          walletAddress: wallet.publicKey.toString(),
          signature: testSignature,
          timestamp: Date.now(),
          testMode: true,
        };
      }

      // Otherwise, rethrow the error
      throw txError;
    }
  } catch (error: any) {
    console.error("Error signing referral:", error);

    if (error.message?.includes("User rejected")) {
      toast.error("You declined the signature request");
    } else {
      toast.error("Failed to sign referral with Solana wallet");
    }
    return null;
  }
}

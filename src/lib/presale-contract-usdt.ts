import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "sonner";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { MASTER_WALLET_ADDRESS, USDT_SPL_TOKEN_ADDRESS } from "./constants";

// Solana USDT Presale Functions
export const solanaUsdtPresale = {
  /**
   * Buy tokens with USDT on Solana
   */
  buyTokens: async (
    connection: Connection,
    wallet: any, // Wallet adapter's wallet object
    amountInUsdt: number,
    referrer?: string // Referrer address or code
  ) => {
    if (!wallet.publicKey) {
      toast.error(
        "Wallet not connected. Please connect your wallet to proceed."
      );
      return null;
    }

    try {
      // USDT on Solana typically has 6 decimals
      const usdtMint = new PublicKey(USDT_SPL_TOKEN_ADDRESS);
      const mintInfo = await getMint(connection, usdtMint);
      const decimals = mintInfo.decimals;

      // Convert amount to token units with proper decimals
      const amountInTokenUnits = Math.floor(
        amountInUsdt * Math.pow(10, decimals)
      );

      // Get the sender's USDT token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        usdtMint,
        wallet.publicKey
      );

      // Get or create the receiver's USDT token account
      const receiverTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        usdtMint,
        new PublicKey(MASTER_WALLET_ADDRESS)
      );

      // Check if the sender has enough USDT
      try {
        const tokenBalance =
          await connection.getTokenAccountBalance(senderTokenAccount);
        const balance = Number(tokenBalance.value.amount);

        if (balance < amountInTokenUnits) {
          toast.error(
            `Insufficient USDT balance. You need at least ${amountInUsdt} USDT.`
          );
          return null;
        }
      } catch (error) {
        toast.error(
          "Failed to check USDT balance. Make sure you have USDT tokens."
        );
        return null;
      }

      // Create the transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        senderTokenAccount,
        usdtMint,
        receiverTokenAccount.address,
        wallet.publicKey,
        amountInTokenUnits,
        decimals
      );

      // Add referral code to instruction data if provided
      if (referrer) {
        transferInstruction.data = Buffer.concat([
          transferInstruction.data,
          Buffer.from(referrer),
        ]);
      }

      // Create the transaction
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const transaction = new Transaction().add(transferInstruction);

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send the transaction
      const signature = await wallet.sendTransaction(transaction, connection);

      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast.success(
        `Successfully sent ${amountInUsdt} USDT! View on Solscan:`,
        {
          description: signature,
        }
      );

      return { success: true, signature };
    } catch (error: any) {
      console.error("Error during USDT transaction:", error);
      toast.error("Transaction Failed", {
        description:
          error.message || "An unknown error occurred while sending USDT.",
      });
      return null;
    }
  },
};

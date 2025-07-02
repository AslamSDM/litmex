import { ethers } from "ethers";
import { presaleAbi } from "./abi";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "sonner";
import { MASTER_WALLET_ADDRESS } from "./constants";

// Contract addresse
export const SOLANA_PRESALE_ADDRESS = MASTER_WALLET_ADDRESS;

// Network configurations
export const networks = {
  bsc: {
    chainId: "0x61", // BSC Testnet
    chainName: "Binance Smart Chain Testnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
  },
};

// Helper for BSC token conversion
const formatBscValue = (value: number): string => {
  return ethers.parseEther(value.toString()).toString();
};

// Solana Presale Functions
export const solanaPresale = {
  /**
   * Buy tokens on Solana
   */
  buyTokens: async (
    connection: Connection,
    wallet: any, // Wallet adapter's wallet object
    amountInSol: number,
    referrer?: string // Note: referrer is currently unused in this implementation.
  ) => {
    if (!wallet.publicKey) {
      toast.error(
        "Wallet not connected. Please connect your wallet to proceed."
      );
      return null;
    }

    try {
      const lamports = Math.floor(amountInSol * LAMPORTS_PER_SOL);

      const balance = await connection.getBalance(wallet.publicKey);
      // A fixed 5000 lamports is a common fee for a simple SOL transfer.
      // For more accuracy, you could use `connection.getFeeForMessage` before sending.
      const estimatedFee = 5000;

      if (balance < lamports + estimatedFee) {
        toast.error("Insufficient SOL balance for this transaction.");
        return null;
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("finalized");

      // This creates a simple SOL transfer transaction.
      // If your program requires a custom instruction with data (like a referrer),
      // you would create a TransactionInstruction here instead of a SystemProgram transfer.
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(SOLANA_PRESALE_ADDRESS),
          lamports,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

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

      toast.success(`Successfully sent ${amountInSol} SOL! View on Solscan:`, {
        description: signature,
      });
      return { success: true, signature };
    } catch (error: any) {
      console.error("Error during SOL transaction:", error);
      toast.error("Transaction Failed", {
        description:
          error.message || "An unknown error occurred while sending SOL.",
      });
      return null;
    }
  },

  /**
   * Get presale status from Solana
   * Fetches data from the Solana presale program account
   */
  getPresaleStatus: async (connection: Connection) => {
    try {
      const presaleAccount = new PublicKey(SOLANA_PRESALE_ADDRESS);

      // Fetch account info
      const accountInfo = await connection.getAccountInfo(presaleAccount);
      if (!accountInfo || !accountInfo.data) {
        throw new Error("Failed to fetch presale account data");
      }

      // Parse the account data based on our expected format
      // In a real implementation, you would use a proper layout/schema for decoding
      // This is a simplified example assuming a specific data layout
      const dataBuffer = accountInfo.data;

      // Example decoding - in a real implementation, use proper layout decoding
      const isActive = dataBuffer[0] === 1;

      // Creating a DataView for reading numbers
      const view = new DataView(
        dataBuffer.buffer,
        dataBuffer.byteOffset,
        dataBuffer.byteLength
      );

      // Read values at specific offsets (these offsets would match your program's data structure)
      // Note: Assuming 8-byte (64-bit) numbers for SOL amounts
      const hardCapLamports = view.getBigUint64(8, true); // offset 8, little endian
      const minPurchaseLamports = view.getBigUint64(16, true);
      const maxPurchaseLamports = view.getBigUint64(24, true);
      const tokenPriceLamports = view.getBigUint64(32, true);
      const soldTokensAmount = view.getBigUint64(40, true);
      const totalRaisedLamports = view.getBigUint64(48, true);

      // Convert from lamports to SOL
      const hardCap = (Number(hardCapLamports) / LAMPORTS_PER_SOL).toString();
      const minPurchase = (
        Number(minPurchaseLamports) / LAMPORTS_PER_SOL
      ).toString();
      const maxPurchase = (
        Number(maxPurchaseLamports) / LAMPORTS_PER_SOL
      ).toString();
      const tokenPrice = (
        Number(tokenPriceLamports) / LAMPORTS_PER_SOL
      ).toString();
      const soldTokens = Number(soldTokensAmount).toString();
      const totalRaised = (
        Number(totalRaisedLamports) / LAMPORTS_PER_SOL
      ).toString();

      // Calculate percentage sold
      const percentageSold = (Number(soldTokens) / parseFloat(hardCap)) * 100;

      return {
        isActive,
        hardCap,
        minPurchase,
        maxPurchase,
        tokenPrice,
        soldTokens,
        totalRaised,
        percentageSold,
      };
    } catch (error) {
      console.error("Error getting Solana presale status:", error);
      // Fallback to mock data if we can't fetch real data
      // This ensures the UI still works during development
      return {
        isActive: true,
        hardCap: "500000",
        minPurchase: "1",
        maxPurchase: "10000",
        tokenPrice: "0.001",
        soldTokens: "150000",
        totalRaised: "150",
        percentageSold: 30,
      };
    }
  },
};

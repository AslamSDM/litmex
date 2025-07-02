import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";
import { fetchCryptoPricesServer, getTokenDetails } from "./price-utils";
import { SECOND_TIER_WALLET } from "./constants";
import prisma from "./prisma";

const DISTRIBUTION_WALLET_PRIVATE_KEY =
  process.env.DISTRIBUTION_WALLET_PRIVATE_KEY ?? "";

// Validate that we have a private key
if (!DISTRIBUTION_WALLET_PRIVATE_KEY) {
  console.error(
    "DISTRIBUTION_WALLET_PRIVATE_KEY is not set in environment variables"
  );
}

// Second-tier referral wallet to receive 10% of the referral bonus

/**
 * Records a referral payment in the database without sending tokens
 * Used when a referrer hasn't verified their Solana wallet yet
 *
 * @param referrerId - The ID of the referrer user
 * @param purchaseId - The ID of the purchase that triggered the referral
 * @param value - The payment amount in the original currency
 * @param chain - The blockchain of the payment
 * @returns The created referral payment record
 */
export async function recordPendingReferralPayment(
  referrerId: string,
  purchaseId: string,
  value: number,
  chain: "sol" | "bsc" | "usdt"
) {
  try {
    // Calculate bonus amount (10% of purchase amount in USD)
    const prices = await fetchCryptoPricesServer();
    let purchaseAmountInUsd = 0;

    if (chain === "bsc") {
      purchaseAmountInUsd = parseFloat((value * prices.bnb).toString());
    } else if (chain === "sol") {
      purchaseAmountInUsd = parseFloat((value * prices.sol).toString());
    } else {
      // Assuming 'usdt' chain means USDT on Solana
      purchaseAmountInUsd = value;
    }

    const bonusPercentage = 10; // 10%
    const bonusAmountInUsd = (purchaseAmountInUsd * bonusPercentage) / 100;

    // Your SPL token mint address
    const TOKEN_MINT = new PublicKey(
      "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
    );
    const trump = await getTokenDetails(TOKEN_MINT.toString());
    const trumpPrice = Number(trump?.priceUsd) || 8;

    // Calculate token amount from USD value
    const bonusAmountInTokens = bonusAmountInUsd / trumpPrice;

    // Calculate second-tier amount (10% of the bonus)
    const secondTierPercentage = 10; // 10%
    const secondTierAmountInTokens =
      (bonusAmountInTokens * secondTierPercentage) / 100;
    const referrerAmountInTokens =
      bonusAmountInTokens - secondTierAmountInTokens;

    // Record the pending payment in the database
    const payment = await (prisma as any).referralPayment.create({
      data: {
        referrerId,
        // purchaseId,
        amount: referrerAmountInTokens.toString(),
        amountUsd: bonusAmountInUsd.toString(),
        status: "PENDING",
        paymentCurrency: chain.toUpperCase(),
      },
    });

    return {
      success: true,
      payment,
      tokenAmount: referrerAmountInTokens,
      usdAmount: bonusAmountInUsd,
    };
  } catch (error) {
    console.error("Error recording pending referral payment:", error);
    return { success: false, error };
  }
}

/**
 * Processes any pending referral payments for a user after they verify their wallet
 *
 * @param userId - The ID of the user who just verified their wallet
 * @param walletAddress - The verified Solana wallet address
 * @returns Summary of processed payments
 */
export async function processPendingReferralPayments(
  userId: string,
  walletAddress: string
) {
  try {
    // Find all pending referral payments for this user
    const pendingPayments = await (prisma as any).referralPayment.findMany({
      where: {
        referrerId: userId,
        status: "PENDING",
      },
    });

    if (pendingPayments.length === 0) {
      return {
        success: true,
        processed: 0,
        message: "No pending payments found",
      };
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each payment
    for (const payment of pendingPayments) {
      try {
        // Update status to processing
        await (prisma as any).referralPayment.update({
          where: { id: payment.id },
          data: { status: "PROCESSING" },
        });

        // Send the tokens
        const sent = await sendReferralTokensAmount(
          walletAddress,
          Number(payment.amount),
          payment.id
        );

        if (sent.success) {
          // Update payment status to completed
          await (prisma as any).referralPayment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              transactionSignature: sent.signature || null,
            },
          });
          successCount++;
        } else {
          // Mark as failed
          await (prisma as any).referralPayment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to process payment ${payment.id}:`, error);
        // Mark as failed
        await (prisma as any).referralPayment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        failedCount++;
      }
    }

    return {
      success: true,
      processed: pendingPayments.length,
      succeeded: successCount,
      failed: failedCount,
    };
  } catch (error) {
    console.error("Error processing pending referral payments:", error);
    return { success: false, error };
  }
}

/**
 * Directly sends a specific token amount to a referrer
 */
async function sendReferralTokensAmount(
  referrerAddress: string,
  tokenAmount: number,
  paymentId: string
) {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://mainnet.helius-rpc.com/?api-key=c84ddc95-f80a-480a-b8b0-7df6d2fcc62f"
    );

    // Your SPL token mint address
    const TOKEN_MINT = new PublicKey(
      "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
    );
    const TOKEN_DECIMALS = 6; // Adjust based on your token's decimals

    // Calculate second-tier amount (10% of the total)
    const secondTierPercentage = 10; // 10%
    const secondTierAmount = (tokenAmount * secondTierPercentage) / 100;
    const referrerAmount = tokenAmount - secondTierAmount;

    // Convert to token's smallest unit (considering decimals)
    const referrerTokenAmount = Math.floor(
      referrerAmount * Math.pow(10, TOKEN_DECIMALS)
    );
    const secondTierTokenAmount = Math.floor(
      secondTierAmount * Math.pow(10, TOKEN_DECIMALS)
    );

    // Handle private key
    let distributionWallet: Keypair;
    try {
      // Try base58 format first
      distributionWallet = Keypair.fromSecretKey(
        Buffer.from(bs58.decode(DISTRIBUTION_WALLET_PRIVATE_KEY))
      );
    } catch (error) {
      // Fallback to hex format
      const privateKeyBuffer = Buffer.from(
        DISTRIBUTION_WALLET_PRIVATE_KEY,
        "hex"
      );
      if (privateKeyBuffer.length !== 64) {
        throw new Error(
          `Invalid private key length: ${privateKeyBuffer.length} bytes. Expected 64 bytes.`
        );
      }
      distributionWallet = Keypair.fromSecretKey(privateKeyBuffer);
    }

    // Helper function to create ATA if it doesn't exist
    async function createATAIfNeeded(
      connection: Connection,
      payer: PublicKey,
      mint: PublicKey,
      owner: PublicKey,
      transaction: Transaction
    ) {
      const ata = await getAssociatedTokenAddress(mint, owner);

      try {
        await getAccount(connection, ata);
        // Account exists, no need to create
      } catch (error) {
        // Account doesn't exist, create it
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          payer,
          ata,
          owner,
          mint
        );
        transaction.add(createATAInstruction);
      }

      return ata;
    }

    // Create and send transaction
    const transaction = new Transaction();

    // Get or create associated token accounts
    const distributionTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      distributionWallet.publicKey
    );

    const referrerTokenAccount = await createATAIfNeeded(
      connection,
      distributionWallet.publicKey,
      TOKEN_MINT,
      new PublicKey(referrerAddress),
      transaction
    );

    const secondTierTokenAccount = await createATAIfNeeded(
      connection,
      distributionWallet.publicKey,
      TOKEN_MINT,
      new PublicKey(SECOND_TIER_WALLET),
      transaction
    );

    // Create transfer instruction to referrer
    const transferToReferrerInstruction = createTransferInstruction(
      distributionTokenAccount,
      referrerTokenAccount,
      distributionWallet.publicKey,
      referrerTokenAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    transaction.add(transferToReferrerInstruction);

    // Create transfer instruction to second-tier wallet
    const transferToSecondTierInstruction = createTransferInstruction(
      distributionTokenAccount,
      secondTierTokenAccount,
      distributionWallet.publicKey,
      secondTierTokenAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    transaction.add(transferToSecondTierInstruction);

    // Sign and send
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = distributionWallet.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      distributionWallet,
    ]);

    console.log("Transaction signature:", signature);

    // If we have a paymentId, update the existing payment record
    if (paymentId) {
      try {
        // Use type assertion to bypass TypeScript errors until Prisma is regenerated
        await (prisma as any).referralPayment.update({
          where: { id: paymentId },
          data: {
            status: "COMPLETED",
            transactionSignature: signature,
          },
        });
        console.log(`Updated payment record ${paymentId} as completed`);
      } catch (updateError) {
        console.error(
          `Error updating payment record ${paymentId}:`,
          updateError
        );
      }
    }

    return { success: true, signature };
  } catch (error) {
    console.error("Error sending SPL tokens:", error);
    return { success: false, error };
  }
}

export async function sendReferralTokens(
  referrer: string,
  value: number,
  chain: "sol" | "bsc" | "usdt",
  referrerId?: string
) {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://mainnet.helius-rpc.com/?api-key=c84ddc95-f80a-480a-b8b0-7df6d2fcc62f"
    );

    // Your SPL token mint address
    const TOKEN_MINT = new PublicKey(
      "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN"
    );
    const TOKEN_DECIMALS = 6; // Adjust based on your token's decimals

    // Calculate bonus amount (10% of purchase amount in USD)
    const prices = await fetchCryptoPricesServer();
    let purchaseAmountInUsd = 0;

    if (chain === "bsc") {
      purchaseAmountInUsd = parseFloat((value * prices.bnb).toString());
    } else if (chain === "sol") {
      purchaseAmountInUsd = parseFloat((value * prices.sol).toString());
    } else {
      // Assuming 'usdt' chain means USDT on Solana
      purchaseAmountInUsd = value;
    }
    console.log(purchaseAmountInUsd, "purchaseAmountInUsd");

    const bonusPercentage = 10; // 10%
    const bonusAmountInUsd = (purchaseAmountInUsd * bonusPercentage) / 100;
    const trump = await getTokenDetails(TOKEN_MINT.toString());
    const trumpPrice = Number(trump?.priceUsd) || 8;
    // Get current token price to convert USD to token amount
    // const tokenPriceInUsd = parseFloat(prices.bnb.toString()); // Replace with your token price
    const bonusAmountInTokens = bonusAmountInUsd / trumpPrice;
    // Calculate second-tier amount (10% of the bonus)
    const secondTierPercentage = 10; // 10%
    const secondTierAmountInTokens =
      (bonusAmountInTokens * secondTierPercentage) / 100;
    const referrerAmountInTokens =
      bonusAmountInTokens - secondTierAmountInTokens;

    // Convert to token's smallest unit (considering decimals)
    const referrerTokenAmount = Math.floor(
      referrerAmountInTokens * Math.pow(10, TOKEN_DECIMALS)
    );
    const secondTierTokenAmount = Math.floor(
      secondTierAmountInTokens * Math.pow(10, TOKEN_DECIMALS)
    );

    // Handle private key properly - try different formats if needed
    let distributionWallet: Keypair;
    try {
      // Try base58 format first (standard for Solana private keys)
      distributionWallet = Keypair.fromSecretKey(
        Buffer.from(bs58.decode(DISTRIBUTION_WALLET_PRIVATE_KEY))
      );
    } catch (error) {
      // Fallback to hex format if base58 fails
      try {
        // Make sure the key is the correct length for hex format (64 bytes = 128 hex chars)
        const privateKeyBuffer = Buffer.from(
          DISTRIBUTION_WALLET_PRIVATE_KEY,
          "hex"
        );
        if (privateKeyBuffer.length !== 64) {
          throw new Error(
            `Invalid private key length: ${privateKeyBuffer.length} bytes. Expected 64 bytes.`
          );
        }
        distributionWallet = Keypair.fromSecretKey(privateKeyBuffer);
      } catch (secondError) {
        console.error("Failed to decode private key:", secondError);
        throw new Error("Could not decode distribution wallet private key");
      }
    }

    // Helper function to create ATA if it doesn't exist
    async function createATAIfNeeded(
      connection: Connection,
      payer: PublicKey,
      mint: PublicKey,
      owner: PublicKey,
      transaction: Transaction
    ) {
      const ata = await getAssociatedTokenAddress(mint, owner);

      try {
        await getAccount(connection, ata);
        // Account exists, no need to create
      } catch (error) {
        // Account doesn't exist, create it
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          payer,
          ata,
          owner,
          mint
        );
        transaction.add(createATAInstruction);
      }

      return ata;
    }

    try {
      const transaction = new Transaction();

      // Get or create associated token accounts
      const distributionTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        distributionWallet.publicKey
      );

      const referrerTokenAccount = await createATAIfNeeded(
        connection,
        distributionWallet.publicKey,
        TOKEN_MINT,
        new PublicKey(referrer),
        transaction
      );

      const secondTierTokenAccount = await createATAIfNeeded(
        connection,
        distributionWallet.publicKey,
        TOKEN_MINT,
        new PublicKey(SECOND_TIER_WALLET),
        transaction
      );

      // Create transfer instruction to referrer
      const transferToReferrerInstruction = createTransferInstruction(
        distributionTokenAccount,
        referrerTokenAccount,
        distributionWallet.publicKey,
        referrerTokenAmount,
        [],
        TOKEN_PROGRAM_ID
      );
      transaction.add(transferToReferrerInstruction);

      // Create transfer instruction to second-tier wallet
      const transferToSecondTierInstruction = createTransferInstruction(
        distributionTokenAccount,
        secondTierTokenAccount,
        distributionWallet.publicKey,
        secondTierTokenAmount,
        [],
        TOKEN_PROGRAM_ID
      );
      transaction.add(transferToSecondTierInstruction);

      // Sign and send
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = distributionWallet.publicKey;

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [distributionWallet]
      );

      console.log("Transaction signature:", signature);
      let referraltxn = null;
      try {
        // Get the referrer's user ID from the wallet address
        console.log(`Fetching user ID for referrer ${referrer}`);

        if (referrerId) {
          // Record successful payment in the database
          referraltxn = await (prisma as any).referralPayment.create({
            data: {
              referrerId: referrerId, // Direct assignment instead of connect
              amount: referrerAmountInTokens.toString(),
              amountUsd: bonusAmountInUsd.toString(),
              status: "COMPLETED",
              transactionSignature: signature,
              paymentCurrency: chain.toUpperCase(),
            },
          });
          console.log(
            `Recorded successful referral payment for user ${referrerId}`
          );
        } else {
          console.warn(`Could not find user with Solana address ${referrer}`);
        }
      } catch (recordError) {
        // Don't fail the transaction if recording fails
        console.error("Error recording successful payment:", recordError);
      }

      return { sent: true, referraltxn, signature };
    } catch (error) {
      console.error("Error sending SPL tokens:", error);
      return { sent: false };
    }
  } catch (error) {
    console.error("Error processing referral bonus:", error);
    return { sent: false };
  }
}

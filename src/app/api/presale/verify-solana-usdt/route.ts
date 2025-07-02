import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import prisma from "@/lib/prisma";
import {
  calculateTokenAmount,
  fetchCryptoPricesServer,
  LMX_PRICE_USD,
} from "@/lib/price-utils";
import { sendReferralTokens } from "@/lib/send-referral";
import { MASTER_WALLET_ADDRESS, USDT_SPL_TOKEN_ADDRESS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { ERROR_TYPES } from "@/lib/errors";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Max attempts to check transaction status
const MAX_VERIFICATION_ATTEMPTS = 10;
// Delay between verification attempts in ms (3 seconds - reduced for better UX)
const VERIFICATION_DELAY = 3000;

// Second-tier referral wallet to receive 10% of the referral bonus

// Connection with timeout and retry configuration
const createConnection = () => {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://mainnet.helius-rpc.com/?api-key=c84ddc95-f80a-480a-b8b0-7df6d2fcc62f",
    {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 30000, // 30 seconds
      disableRetryOnRateLimit: false,
    }
  );
};

// Helper function to safely extract account keys
const extractAccountKeys = (txMessage: any): PublicKey[] => {
  try {
    if (!txMessage.accountKeys || !Array.isArray(txMessage.accountKeys)) {
      return [];
    }

    // Handle newer transaction format with nested arrays
    if (Array.isArray(txMessage.accountKeys[0])) {
      return txMessage.accountKeys
        .flat()
        .filter((key: any) => key instanceof PublicKey);
    }

    // Handle simple array structure
    return txMessage.accountKeys.filter((key: any) => key instanceof PublicKey);
  } catch (error) {
    console.error("Error extracting account keys:", error);
    return [];
  }
};

// Helper function to get transaction with retries
const getTransactionWithRetry = async (
  connection: Connection,
  signature: string,
  maxRetries: number = 3
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Attempting to fetch transaction (attempt ${attempt}/${maxRetries}):`,
        signature
      );

      const transaction = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: attempt === maxRetries ? "finalized" : "confirmed",
      });

      if (transaction) {
        console.log("Transaction found on attempt", attempt);
        return transaction;
      }

      if (attempt < maxRetries) {
        console.log(
          `Transaction not found, waiting ${VERIFICATION_DELAY}ms before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, VERIFICATION_DELAY));
      }
    } catch (error) {
      console.error(`Transaction fetch attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return null;
};

// Helper function to check if a transaction is a valid SPL token transfer
const isValidSplTokenTransfer = async (
  connection: Connection,
  transaction: any,
  tokenMintAddress: string,
  recipientAddress: string
): Promise<{ isValid: boolean; amount: number }> => {
  try {
    if (!transaction.meta || !transaction.transaction) {
      return { isValid: false, amount: 0 };
    }

    const tokenMintPubkey = new PublicKey(tokenMintAddress);
    const recipientPubkey = new PublicKey(recipientAddress);

    // Check for SPL token program in the account keys
    const tokenProgramIndex =
      transaction.transaction.message.accountKeys.findIndex((key: any) =>
        key.equals(new PublicKey(TOKEN_PROGRAM_ID))
      );

    if (tokenProgramIndex === -1) {
      return { isValid: false, amount: 0 };
    }

    // Check if the token mint address is involved in the transaction
    let foundTokenMint = false;
    let amount = 0;

    // Check pre/post token balances for the recipient
    if (
      transaction.meta.preTokenBalances &&
      transaction.meta.postTokenBalances
    ) {
      let preBalance = 0;
      let postBalance = 0;

      // Find the recipient's pre and post balances for the specific token
      for (const balance of transaction.meta.preTokenBalances) {
        if (
          balance.mint === tokenMintAddress &&
          balance.owner === recipientAddress
        ) {
          preBalance =
            Number(balance.uiTokenAmount.amount) /
            Math.pow(10, balance.uiTokenAmount.decimals);
        }
      }

      for (const balance of transaction.meta.postTokenBalances) {
        if (
          balance.mint === tokenMintAddress &&
          balance.owner === recipientAddress
        ) {
          postBalance =
            Number(balance.uiTokenAmount.amount) /
            Math.pow(10, balance.uiTokenAmount.decimals);
          foundTokenMint = true;
        }
      }

      // Calculate the amount transferred (increase in recipient's balance)
      if (foundTokenMint) {
        amount = postBalance - preBalance;
      }
    }

    return {
      isValid: foundTokenMint && amount > 0,
      amount: amount,
    };
  } catch (error) {
    console.error("Error verifying SPL token transfer:", error);
    return { isValid: false, amount: 0 };
  }
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Session validation
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: ERROR_TYPES.AUTH_REQUIRED.message,
          code: ERROR_TYPES.AUTH_REQUIRED.code,
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { signature, currency = "SOL" } = body;

    if (typeof signature !== "string" || signature.length < 80) {
      return NextResponse.json(
        { error: "Invalid signature format" },
        { status: 400 }
      );
    }
    console.log(session.user.id);
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Verifying transaction for user:", user.id);

    // Check existing transaction record
    let existingTransactionRecord = await (
      prisma as any
    ).transaction.findUnique({
      where: { hash: signature },
    });

    // Return if already completed
    if (
      existingTransactionRecord?.status === "COMPLETED" &&
      existingTransactionRecord.completedPurchase
    ) {
      return NextResponse.json({
        verified: true,
        transaction: existingTransactionRecord,
        purchase: existingTransactionRecord.completedPurchase,
        cached: true,
      });
    }

    // Update or create transaction record
    if (existingTransactionRecord?.status === "PENDING") {
      // Check if we've exceeded max attempts
      if (existingTransactionRecord.checkCount >= MAX_VERIFICATION_ATTEMPTS) {
        await (prisma as any).transaction.update({
          where: { id: existingTransactionRecord.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json(
          {
            error: "Transaction verification failed after multiple attempts",
            status: "FAILED",
            transaction: existingTransactionRecord,
          },
          { status: 400 }
        );
      }

      existingTransactionRecord = await (prisma as any).transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          checkCount: { increment: 1 },
          lastChecked: new Date(),
        },
      });
    } else if (!existingTransactionRecord) {
      existingTransactionRecord = await (prisma as any).transaction.create({
        data: {
          hash: signature,
          status: "PENDING",
          network: "SOLANA",
          tokenAmount: "0",
          paymentAmount: "0",
          paymentCurrency: currency,
          checkCount: 1,
          user: { connect: { id: user.id } },
        },
      });
    }

    // Connect to Solana with error handling
    let connection: Connection;
    try {
      connection = createConnection();
    } catch (error) {
      console.error("Failed to create Solana connection:", error);
      return NextResponse.json(
        { error: "Failed to connect to Solana network" },
        { status: 503 }
      );
    }

    // Fetch transaction with retries
    const transaction = await getTransactionWithRetry(connection, signature);

    if (!transaction) {
      return NextResponse.json({
        status: "PENDING",
        message: "Transaction not yet confirmed on Solana network",
        transaction: existingTransactionRecord,
        attempts: existingTransactionRecord.checkCount,
        maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      });
    }

    // Validate transaction structure
    if (!transaction.meta || !transaction.transaction?.message) {
      await (prisma as any).transaction.update({
        where: { id: existingTransactionRecord.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Invalid transaction structure" },
        { status: 400 }
      );
    }

    let transferAmount = 0;
    let isValidTransfer = false;

    // Extract and validate account keys
    const accountKeys = extractAccountKeys(transaction.transaction.message);
    const senderAddress = accountKeys[0]?.toBase58() || "";

    // Handle different currencies
    if (currency === "USDT") {
      // Check for USDT SPL token transfer
      const splVerification = await isValidSplTokenTransfer(
        connection,
        transaction,
        USDT_SPL_TOKEN_ADDRESS,
        MASTER_WALLET_ADDRESS
      );

      isValidTransfer = splVerification.isValid;
      transferAmount = splVerification.amount;
    } else {
      // Default SOL handling
      const isTransferToMasterWallet = accountKeys.some(
        (key) => key.toBase58() === MASTER_WALLET_ADDRESS
      );

      if (!isTransferToMasterWallet) {
        await (prisma as any).transaction.update({
          where: { id: existingTransactionRecord.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json(
          {
            error:
              "Transaction is not a valid transfer to the presale master wallet",
            transaction: existingTransactionRecord,
          },
          { status: 400 }
        );
      }

      // Calculate transfer amount from balance changes for SOL
      if (transaction.meta.preBalances && transaction.meta.postBalances) {
        const balanceChange =
          transaction.meta.preBalances[0] - transaction.meta.postBalances[0];
        if (balanceChange > 0) {
          transferAmount = balanceChange / LAMPORTS_PER_SOL; // Convert lamports to SOL
          isValidTransfer = true;
        }
      }
    }

    if (!isValidTransfer || transferAmount <= 0) {
      await (prisma as any).transaction.update({
        where: { id: existingTransactionRecord.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          error: "Invalid transfer amount detected",
          transaction: existingTransactionRecord,
        },
        { status: 400 }
      );
    }

    // Check for existing purchase
    const existingPurchaseRecord = await prisma.purchase.findUnique({
      where: { transactionSignature: signature },
    });

    if (existingPurchaseRecord) {
      await (prisma as any).transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          status: "COMPLETED",
          paymentAmount: transferAmount.toString(),
        },
      });

      return NextResponse.json({
        verified: true,
        transaction: existingTransactionRecord,
        purchase: existingPurchaseRecord,
        processingTime: Date.now() - startTime,
      });
    }

    // Process new purchase
    let referralPaid = false;
    let referralTxn;
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle referral bonus
    if (sender.referrerId) {
      const referrer = await prisma.user.findUnique({
        where: { id: sender.referrerId },
        select: { id: true, solanaAddress: true },
      });

      if (referrer?.solanaAddress) {
        try {
          const { sent, referraltxn } = await sendReferralTokens(
            referrer.solanaAddress,
            transferAmount,
            "usdt",
            sender.referrerId
          );
          referralPaid = sent;
          referralTxn = referraltxn || null;
        } catch (error) {
          console.error("Error sending referral tokens:", error);
        }
      }
    }

    // Calculate token amount and create purchase
    const prices = await fetchCryptoPricesServer();
    const tokenAmount = calculateTokenAmount(
      transferAmount,
      currency.toLowerCase(),
      prices
    );

    const purchase = await (prisma as any).purchase.create({
      data: {
        userId: sender.id,
        network: "SOLANA",
        paymentAmount: transferAmount,
        paymentCurrency: currency,
        lmxTokensAllocated: tokenAmount,
        pricePerLmxInUsdt: LMX_PRICE_USD,
        transactionSignature: signature,
        referralBonusPaid: referralPaid,
        status: "COMPLETED",
        transactionId: existingTransactionRecord.id,
        referraltxnId: referralTxn?.id || null,
      },
    });

    // Update transaction record
    const updatedTransaction = await (prisma as any).transaction.update({
      where: { id: existingTransactionRecord.id },
      data: {
        status: "COMPLETED",
        tokenAmount: tokenAmount.toString(),
        paymentAmount: transferAmount.toString(),
      },
    });

    return NextResponse.json({
      verified: true,
      transaction: {
        signature,
        sender: senderAddress,
        amount: transferAmount,
        currency: currency,
      },
      purchase,
      transactionRecord: updatedTransaction,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Error verifying Solana transaction:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Transaction verification timed out, please try again" },
          { status: 408 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded, please wait before retrying" },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}

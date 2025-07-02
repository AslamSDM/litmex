import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ethers } from "ethers";
import { presaleAbi } from "@/lib/abi";
import { LMX_PRICE_USD } from "@/lib/price-utils";
import { formatEther, formatUnits } from "viem";

import { sendReferralTokens } from "@/lib/send-referral";
import {
  BSC_PRESALE_CONTRACT_ADDRESS,
  BSC_USDT_ADDRESS,
} from "@/lib/constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { ERROR_TYPES } from "@/lib/errors";

// Max attempts to check transaction status
const MAX_VERIFICATION_ATTEMPTS = 10;
// Delay between verification attempts in ms (5 seconds)
const VERIFICATION_DELAY = 5000;
// USDT has 18 decimals on BSC (Binance-Peg USDT)
const USDT_DECIMALS = 18;

// Validation schema
const verificationSchema = z.object({
  hash: z.string(),
});

// ERC20 ABI (minimal for our needs)
const erc20Abi = [
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
];

// Event definition for TokensPurchasedWithUsdt
const tokensPurchasedWithUsdtEvent =
  "TokensPurchasedWithUsdt(address,uint256,uint256,address)";

export async function POST(req: NextRequest) {
  try {
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { hash } = verificationSchema.parse(body);

    if (!hash) {
      return NextResponse.json(
        { status: "ERROR", message: "No transaction hash provided" },
        { status: 400 }
      );
    }

    // Check if we already have tracked this transaction
    let existingTransactionRecord = await prisma.transaction.findUnique({
      where: { hash },
    });

    // If transaction already exists and was completed, return the result
    if (existingTransactionRecord?.status === "COMPLETED") {
      // Find any associated purchase
      const associatedPurchase = await prisma.purchase.findFirst({
        where: { transactionSignature: hash },
      });

      return NextResponse.json({
        verified: true,
        transaction: existingTransactionRecord,
        purchase: associatedPurchase,
      });
    }

    // If transaction exists but it's still pending and under max check count, update counter and proceed
    if (
      existingTransactionRecord &&
      existingTransactionRecord.status === "PENDING"
    ) {
      existingTransactionRecord = await prisma.transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          checkCount: {
            increment: 1,
          },
          lastChecked: new Date(),
        },
      });
    }

    // If no existing transaction, create a new one
    if (!existingTransactionRecord) {
      existingTransactionRecord = await prisma.transaction.create({
        data: {
          hash,
          status: "PENDING",
          network: "BSC",
          // These fields will be updated after verification
          tokenAmount: "0",
          paymentAmount: "0",
          paymentCurrency: "USDT",
          user: {
            connect: { id: user.id },
          },
        },
      });
    }

    // Determine if we're on testnet or mainnet
    const isTestnet = process.env.NEXT_PUBLIC_BSC_TESTNET === "true";

    // Connect to BSC
    const rpcUrl = isTestnet
      ? "https://data-seed-prebsc-1-s1.binance.org:8545/" // BSC Testnet
      : "https://bsc-dataseed.binance.org/"; // BSC Mainnet

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(hash);

    if (!receipt) {
      // If we've exceeded max check count, mark as failed
      if (existingTransactionRecord.checkCount >= MAX_VERIFICATION_ATTEMPTS) {
        await prisma.transaction.update({
          where: { id: existingTransactionRecord.id },
          data: {
            status: "FAILED",
          },
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

      return NextResponse.json({
        status: "PENDING",
        message: "Transaction not yet confirmed, will retry verification",
        transaction: existingTransactionRecord,
      });
    }

    // Verify transaction status
    if (receipt.status === 0) {
      // Update transaction record to mark as failed
      await prisma.transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error: "Transaction failed on the blockchain",
          transaction: existingTransactionRecord,
        },
        { status: 400 }
      );
    }

    // Verify this is a transaction to our presale contract
    console.log(receipt.to, BSC_PRESALE_CONTRACT_ADDRESS);
    if (
      receipt.to?.toLowerCase() !== BSC_PRESALE_CONTRACT_ADDRESS.toLowerCase()
    ) {
      // Update transaction record to mark as failed
      await prisma.transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          error: "Transaction is not to the presale contract",
          transaction: existingTransactionRecord,
        },
        { status: 400 }
      );
    }

    // Check if we already have this transaction recorded as a purchase
    const existingPurchaseRecord = await prisma.purchase.findUnique({
      where: { transactionSignature: hash },
    });

    if (existingPurchaseRecord) {
      // Update our transaction record to link to the existing purchase
      await prisma.transaction.update({
        where: { id: existingTransactionRecord.id },
        data: {
          status: "COMPLETED",
        },
      });

      return NextResponse.json(
        {
          verified: true,
          transaction: existingTransactionRecord,
          purchase: existingPurchaseRecord,
        },
        { status: 200 }
      );
    }

    // Get transaction details
    const transaction = await provider.getTransaction(hash);

    if (!transaction) {
      return NextResponse.json(
        { error: "Could not fetch complete transaction details" },
        { status: 500 }
      );
    }

    // Create contract interface to decode input data
    const contractInterface = new ethers.Interface(presaleAbi.abi);

    // Try to decode transaction input
    let decodedData;
    try {
      decodedData = contractInterface.parseTransaction({
        data: transaction.data,
      });
    } catch (error) {
      console.error("Error decoding transaction data:", error);
      return NextResponse.json(
        { error: "Could not decode transaction data" },
        { status: 400 }
      );
    }

    // Check if this is a buyTokensWithUsdt function call
    if (decodedData?.name !== "buyTokensWithUsdt") {
      return NextResponse.json(
        { error: "Transaction is not a USDT token purchase" },
        { status: 400 }
      );
    }

    // Extract token amount from function arguments
    const tokenAmount = Number(decodedData.args[0]);

    // Look for TokensPurchasedWithUsdt event
    let buyer = transaction.from;
    let usdtAmount = "0";

    // Create event interface
    const eventInterface = new ethers.Interface([
      `event TokensPurchasedWithUsdt(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount, address indexed referrer)`,
    ]);

    const eventTopic = ethers.id(tokensPurchasedWithUsdtEvent);

    // Filter logs for the event
    for (const log of receipt.logs) {
      // Check if this log is from our contract and has the right event
      if (
        log.address.toLowerCase() ===
          BSC_PRESALE_CONTRACT_ADDRESS.toLowerCase() &&
        log.topics[0] === eventTopic
      ) {
        try {
          const parsedLog = eventInterface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (parsedLog) {
            buyer = parsedLog.args.buyer;
            usdtAmount = formatUnits(parsedLog.args.usdtAmount, USDT_DECIMALS);
            break;
          }
        } catch (error) {
          console.error("Error parsing event log:", error);
        }
      }
    }

    // If we couldn't parse the event properly
    if (usdtAmount === "0") {
      // Find USDT transfer event as fallback method
      const usdtTransferTopic = ethers.id("Transfer(address,address,uint256)");

      for (const log of receipt.logs) {
        if (
          log.address.toLowerCase() === BSC_USDT_ADDRESS.toLowerCase() &&
          log.topics[0] === usdtTransferTopic
        ) {
          const usdtInterface = new ethers.Interface([
            "event Transfer(address indexed from, address indexed to, uint256 value)",
          ]);

          try {
            const transferLog = usdtInterface.parseLog({
              topics: log.topics,
              data: log.data,
            });

            if (
              transferLog &&
              transferLog.args.to.toLowerCase() ===
                BSC_PRESALE_CONTRACT_ADDRESS.toLowerCase()
            ) {
              usdtAmount = formatUnits(transferLog.args.value, USDT_DECIMALS);
              break;
            }
          } catch (error) {
            console.error("Error parsing USDT transfer:", error);
          }
        }
      }
    }

    // Last resort - calculate based on token amount and price
    if (usdtAmount === "0") {
      const calculatedUsdtValue =
        Number(formatEther(BigInt(tokenAmount))) * LMX_PRICE_USD;
      usdtAmount = calculatedUsdtValue.toString();
    }

    let referralPaid = false;
    let referralTxn = null;
    if (user.referrerId) {
      const referrer = await prisma.user.findUnique({
        where: { id: user.referrerId },
      });
      if (referrer?.solanaAddress) {
        const { sent, referraltxn } = await sendReferralTokens(
          referrer.solanaAddress,
          parseFloat(usdtAmount),
          "usdt",
          user.referrerId
        );
        referralPaid = sent || false;
        referralTxn = referraltxn || null;
      }
    }

    // Create a new purchase record
    const newPurchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        transactionSignature: hash,
        paymentAmount: usdtAmount,
        lmxTokensAllocated: formatEther(BigInt(tokenAmount)),
        pricePerLmxInUsdt: LMX_PRICE_USD,
        network: "BSC",
        status: "COMPLETED",
        paymentCurrency: "USDT",
        referralBonusPaid: referralPaid,
        referraltxnId: referralTxn?.id || null,
        // These fields may be included if they exist in the schema, otherwise remove them
        // Only keep fields that exist in your Prisma schema
      },
    });

    // Update transaction record with token and payment info
    const updatedTransaction = await prisma.transaction.update({
      where: { id: existingTransactionRecord.id },
      data: {
        status: "COMPLETED",
        tokenAmount: formatEther(BigInt(tokenAmount)),
        paymentAmount: usdtAmount,
      },
    });

    return NextResponse.json({
      verified: true,
      transaction: {
        hash,
        sender: transaction.from,
        amount: usdtAmount, // USDT amount
        tokenAmount: tokenAmount, // LMX token amount
        blockNumber: receipt.blockNumber,
        gasFee: ethers.formatEther(transaction.gasPrice * receipt.gasUsed),
      },
      purchase: newPurchase,
      transactionRecord: updatedTransaction,
    });
  } catch (error) {
    console.error("Error verifying BSC USDT transaction:", error);
    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}

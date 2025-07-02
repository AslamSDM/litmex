import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { ERROR_TYPES } from "@/lib/errors";

// Validation schema
const transactionCheckSchema = z.object({
  hash: z.string(),
});

/**
 * This endpoint checks the database directly to see if a transaction
 * has already been recorded and completed. It helps resolve UI
 * stuck states by directly returning the transaction status.
 */
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

    const body = await req.json();
    const { hash } = transactionCheckSchema.parse(body);

    if (!hash) {
      return NextResponse.json(
        { status: "ERROR", message: "No transaction hash provided" },
        { status: 400 }
      );
    }

    // Check if the transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { hash },
      include: {
        Purchase: true, // Include the associated purchase if any
      },
    });

    if (!transaction) {
      return NextResponse.json({
        status: "NOT_FOUND",
        message: "Transaction not found in database",
        verified: false,
      });
    }

    // Check if purchase exists even if not linked to this transaction
    // (Sometimes the relationship might not be properly established)
    const purchase =
      transaction.Purchase ||
      (await prisma.purchase.findUnique({
        where: { transactionSignature: hash },
      }));

    // Determine the overall status
    let status = transaction.status;
    let verified = transaction.status === "COMPLETED";
    let message = verified
      ? "Transaction has been verified and completed"
      : "Transaction is still pending verification";

    // If purchase exists but transaction not marked complete, update the transaction
    if (purchase && transaction.status !== "COMPLETED") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          purchaseId: purchase.id,
        },
      });

      // Update our response
      status = "COMPLETED";
      verified = true;
      message =
        "Transaction status was updated to completed based on purchase record";
    }

    return NextResponse.json({
      status,
      message,
      verified,
      transaction: {
        ...transaction,
        Purchase: purchase,
      },
    });
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return NextResponse.json(
      { error: "Failed to check transaction status", verified: false },
      { status: 500 }
    );
  }
}

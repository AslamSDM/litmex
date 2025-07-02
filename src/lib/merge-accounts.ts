import prisma from "@/lib/prisma";

// Define an interface for the result of a merged account
export interface MergedUserResult {
  id: string;
  [key: string]: any; // Allow any other properties
  mergeInfo?: {
    wasMerged: boolean;
    keptAccountId: string;
    mergedAccountId: string;
    mergedAt: string;
    primaryWasKept: boolean;
    purchases: number;
    bonuses: number;
    referrals: number;
  };
}

/**
 * Merge accounts when a user connects multiple wallet types (EVM and Solana)
 * This function will identify if there are separate accounts for EVM and Solana addresses
 * and merge them into a single user account.
 *
 * @param walletAddress The wallet address being connected
 * @param walletType The type of wallet being connected ('solana' or 'ethereum')
 * @returns The merged user account with merge information
 */
export async function mergeWalletAccounts(
  walletAddress: string,
  walletType: "solana" | "ethereum"
): Promise<MergedUserResult | null> {
  try {
    // Step 1: Identify if the user already has accounts with different wallet types
    // Find user by current wallet address that's being connected
    const primaryUser = await (prisma as any).user.findFirst({
      where: {
        OR: [
          { walletAddress },
          {
            solanaAddress: walletType === "solana" ? walletAddress : undefined,
          },
          { evmAddress: walletType === "ethereum" ? walletAddress : undefined },
        ],
      },
      include: {
        purchases: true,
        receivedBonuses: true,
        referrals: {
          select: {
            id: true,
          },
        },
      },
    });

    // If no user found with this wallet address, no merging needed
    if (!primaryUser) {
      return null;
    }

    // Step 2: Find other accounts that might belong to the same user
    // If we found a Solana account, look for matching EVM accounts and vice versa
    const searchField =
      walletType === "solana" ? "evmAddress" : "solanaAddress";
    const otherAccount = await (prisma as any).user.findFirst({
      where: {
        [searchField]: { not: null },
        // Don't include the same user we already found
        id: { not: primaryUser.id },
        // Look for matching email if available
        ...(primaryUser.email ? { email: primaryUser.email } : {}),
      },
      include: {
        purchases: true,
        receivedBonuses: true,
        referrals: {
          select: {
            id: true,
          },
        },
      },
    });

    // If no other account found, no merging needed
    if (!otherAccount) {
      return primaryUser;
    }

    // Step 3: Merge accounts - transfer all data from the other account to the primary one
    console.log(`Merging accounts: ${primaryUser.id} and ${otherAccount.id}`);

    // Determine which account to keep (primary) and which to merge (secondary)
    // Prefer keeping the account with more data/activity
    const primaryUserActivityScore =
      (primaryUser.purchases?.length || 0) +
      (primaryUser.receivedBonuses?.length || 0) +
      (primaryUser.referrals?.length || 0);

    const otherAccountActivityScore =
      (otherAccount.purchases?.length || 0) +
      (otherAccount.receivedBonuses?.length || 0) +
      (otherAccount.referrals?.length || 0);

    // Log account activity metrics for debugging
    console.log(`Account activity metrics:
      Primary user (${primaryUser.id}): ${primaryUserActivityScore} activities
      - Purchases: ${primaryUser.purchases?.length || 0}
      - Bonuses: ${primaryUser.receivedBonuses?.length || 0}
      - Referrals: ${primaryUser.referrals?.length || 0}
      
      Other account (${
        otherAccount.id
      }): ${otherAccountActivityScore} activities
      - Purchases: ${otherAccount.purchases?.length || 0}
      - Bonuses: ${otherAccount.receivedBonuses?.length || 0}
      - Referrals: ${otherAccount.referrals?.length || 0}
    `);

    const keepPrimary = primaryUserActivityScore >= otherAccountActivityScore;

    const [keepAccount, mergeAccount] = keepPrimary
      ? [primaryUser, otherAccount]
      : [otherAccount, primaryUser];

    console.log(
      `Decision: Keeping account ${keepAccount.id} and merging account ${mergeAccount.id}`
    );

    // Start a transaction for the merge process
    await (prisma as any).$transaction(async (tx: any) => {
      // Update the account we're keeping with any missing wallet addresses
      await tx.user.update({
        where: { id: keepAccount.id },
        data: {
          // If the account we're keeping doesn't have the Solana address from the other account, add it
          solanaAddress:
            keepAccount.solanaAddress || mergeAccount.solanaAddress,
          // If the account we're keeping doesn't have the EVM address from the other account, add it
          evmAddress: keepAccount.evmAddress || mergeAccount.evmAddress,
          // Combine wallet types
          walletType: keepAccount.walletType || mergeAccount.walletType,
          // Preserve email if available
          email: keepAccount.email || mergeAccount.email,
          // Use the username from the account we're keeping, or from the other if not set
          username: keepAccount.username || mergeAccount.username,
          // Keep the highest verification status
          solanaVerified:
            keepAccount.solanaVerified || mergeAccount.solanaVerified,
          evmVerified: keepAccount.evmVerified || mergeAccount.evmVerified,
          walletVerified:
            keepAccount.walletVerified || mergeAccount.walletVerified,
        },
      });

      // Update all purchases from the merged account to be associated with the kept account
      if (mergeAccount.purchases?.length > 0) {
        await tx.purchase.updateMany({
          where: { userId: mergeAccount.id },
          data: { userId: keepAccount.id },
        });
      }

      // Update all referral bonuses from the merged account
      if (mergeAccount.receivedBonuses?.length > 0) {
        await tx.referralBonus.updateMany({
          where: { referrerId: mergeAccount.id },
          data: { referrerId: keepAccount.id },
        });
      }

      // Update all users who had the merged account as a referrer
      if (mergeAccount.referrals?.length > 0) {
        await tx.user.updateMany({
          where: { referrerId: mergeAccount.id },
          data: { referrerId: keepAccount.id },
        });
      }

      // Delete the merged account
      await tx.user.delete({
        where: { id: mergeAccount.id },
      });
    });

    // Fetch and return the final merged user with detailed info
    const mergedUser = await (prisma as any).user.findUnique({
      where: { id: keepAccount.id },
      include: {
        purchases: true,
        receivedBonuses: true,
        referrals: {
          select: { id: true },
        },
      },
    });

    // Add merge metadata to help with frontend notifications
    const mergeResult = {
      ...mergedUser,
      mergeInfo: {
        wasMerged: true,
        keptAccountId: keepAccount.id,
        mergedAccountId: mergeAccount.id,
        mergedAt: new Date().toISOString(),
        primaryWasKept: keepPrimary,
        purchases: mergedUser.purchases?.length || 0,
        bonuses: mergedUser.receivedBonuses?.length || 0,
        referrals: mergedUser.referrals?.length || 0,
      },
    };

    console.log("Account merge completed successfully");
    return mergeResult;
  } catch (error) {
    console.error("Error merging wallet accounts:", error);
    // If there's an error, return null to indicate merge failed
    return null;
  }
}

-- filepath: /Users/aslam/tempy/Litmex/prisma/migrations/20250606_add_wallet_verification/migration.sql

-- Add new fields for wallet verification
ALTER TABLE "User" ADD COLUMN "walletAddress" TEXT;
ALTER TABLE "User" ADD COLUMN "walletType" TEXT;
ALTER TABLE "User" ADD COLUMN "walletVerified" BOOLEAN DEFAULT false;

-- Update indices
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- Migration: Add dispute reason + status to Rating
ALTER TABLE "Rating"
  ADD COLUMN IF NOT EXISTS "disputeReason" TEXT,
  ADD COLUMN IF NOT EXISTS "disputeStatus" TEXT;

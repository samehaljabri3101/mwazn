-- Migration: Add disputed flag to Rating
ALTER TABLE "Rating"
  ADD COLUMN IF NOT EXISTS "isDisputed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "disputedAt" TIMESTAMP(3);

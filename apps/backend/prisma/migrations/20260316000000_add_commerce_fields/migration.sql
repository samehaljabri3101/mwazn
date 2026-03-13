-- Migration: Add commerce integration fields to Company
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "hasExternalStore" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "externalStorePlatform" TEXT,
  ADD COLUMN IF NOT EXISTS "externalStoreUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "externalStoreName" TEXT,
  ADD COLUMN IF NOT EXISTS "allowDirectOrder" BOOLEAN NOT NULL DEFAULT false;

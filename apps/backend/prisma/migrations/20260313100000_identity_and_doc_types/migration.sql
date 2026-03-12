-- Add identity fields to Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "governmentId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "governmentIdType" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "businessPlatformVerificationNumber" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "maroofNumber" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "verificationSource" TEXT;

-- Backfill verificationSource for existing business accounts
UPDATE "Company" SET "verificationSource" = 'CR' WHERE "crNumber" IS NOT NULL AND "isFreelancer" = false;

-- Migrate existing freelancers that had nationalId wrongly stored in crNumber (10-digit strings)
UPDATE "Company"
SET "governmentId" = "crNumber",
    "governmentIdType" = 'NATIONAL_ID',
    "verificationSource" = 'MANUAL',
    "crNumber" = NULL
WHERE "isFreelancer" = true AND "crNumber" ~ E'^\\d{10}$';

-- Add new DocumentType enum values (PostgreSQL supports IF NOT EXISTS for enum values)
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'NATIONAL_ID';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'IQAMA';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'BUSINESS_PLATFORM';
ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'MAROOF';

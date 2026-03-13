-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'REMOVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModerationSource" AS ENUM ('SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "AppealTargetType" AS ENUM ('RFQ', 'LISTING');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- AlterTable: add moderation columns to Listing
ALTER TABLE "Listing"
  ADD COLUMN "moderationStatus"  "ModerationStatus"  NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "moderationReason"  TEXT,
  ADD COLUMN "moderatedById"     TEXT,
  ADD COLUMN "moderatedAt"       TIMESTAMP(3),
  ADD COLUMN "moderationSource"  "ModerationSource";

-- AlterTable: add moderation columns to RFQ
ALTER TABLE "RFQ"
  ADD COLUMN "moderationStatus"  "ModerationStatus"  NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "moderationReason"  TEXT,
  ADD COLUMN "moderatedById"     TEXT,
  ADD COLUMN "moderatedAt"       TIMESTAMP(3),
  ADD COLUMN "moderationSource"  "ModerationSource";

-- CreateTable: ModerationAppeal
CREATE TABLE "ModerationAppeal" (
  "id"                       TEXT NOT NULL,
  "targetType"               "AppealTargetType" NOT NULL,
  "targetId"                 TEXT NOT NULL,
  "appellantUserId"          TEXT NOT NULL,
  "appellantCompanyId"       TEXT NOT NULL,
  "appealStatus"             "AppealStatus" NOT NULL DEFAULT 'OPEN',
  "originalModerationStatus" "ModerationStatus" NOT NULL,
  "reason"                   TEXT NOT NULL,
  "adminResponse"            TEXT,
  "reviewedById"             TEXT,
  "reviewedAt"               TIMESTAMP(3),
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModerationAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_moderationStatus_idx" ON "Listing"("moderationStatus");

-- CreateIndex
CREATE INDEX "RFQ_moderationStatus_idx" ON "RFQ"("moderationStatus");

-- CreateIndex
CREATE INDEX "ModerationAppeal_appellantUserId_idx" ON "ModerationAppeal"("appellantUserId");

-- CreateIndex
CREATE INDEX "ModerationAppeal_targetType_targetId_idx" ON "ModerationAppeal"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationAppeal_appealStatus_idx" ON "ModerationAppeal"("appealStatus");

-- AddForeignKey
ALTER TABLE "ModerationAppeal"
  ADD CONSTRAINT "ModerationAppeal_appellantUserId_fkey"
  FOREIGN KEY ("appellantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAppeal"
  ADD CONSTRAINT "ModerationAppeal_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

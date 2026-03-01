-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CR', 'VAT', 'LICENSE', 'ISO', 'OTHER');

-- AlterTable: Company — add verification + scoring columns
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "supplierScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "scoreUpdatedAt" TIMESTAMP(3);

-- CreateTable: Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"        TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "plan"      TEXT NOT NULL DEFAULT 'PRO',
  "amount"    DECIMAL(12,2) NOT NULL,
  "currency"  TEXT NOT NULL DEFAULT 'SAR',
  "status"    "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
  "provider"  TEXT NOT NULL DEFAULT 'manual',
  "reference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt"    TIMESTAMP(3),

  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Invoice_companyId_idx" ON "Invoice"("companyId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: CompanyVerificationDocument
CREATE TABLE IF NOT EXISTS "CompanyVerificationDocument" (
  "id"          TEXT NOT NULL,
  "companyId"   TEXT NOT NULL,
  "type"        "DocumentType" NOT NULL,
  "fileUrl"     TEXT NOT NULL,
  "uploadedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"  TIMESTAMP(3),
  "reviewerId"  TEXT,
  "decision"    TEXT,
  "notes"       TEXT,

  CONSTRAINT "CompanyVerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompanyVerificationDocument_companyId_idx" ON "CompanyVerificationDocument"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyVerificationDocument_decision_idx" ON "CompanyVerificationDocument"("decision");

ALTER TABLE "CompanyVerificationDocument"
  ADD CONSTRAINT "CompanyVerificationDocument_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: AnalyticsEvent
CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id"        TEXT NOT NULL,
  "event"     TEXT NOT NULL,
  "companyId" TEXT,
  "userId"    TEXT,
  "entityId"  TEXT,
  "meta"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_companyId_idx" ON "AnalyticsEvent"("companyId");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- Full-text search indexes on listings and companies
CREATE INDEX IF NOT EXISTS "Listing_fts_idx" ON "Listing"
  USING gin(to_tsvector('simple', coalesce("titleEn",'') || ' ' || coalesce("titleAr",'') || ' ' || coalesce("descriptionEn",'')));

CREATE INDEX IF NOT EXISTS "Company_fts_idx" ON "Company"
  USING gin(to_tsvector('simple', coalesce("nameEn",'') || ' ' || coalesce("nameAr",'') || ' ' || coalesce("city",'')));

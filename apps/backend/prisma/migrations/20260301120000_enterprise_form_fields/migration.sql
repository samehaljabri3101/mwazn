-- Migration: enterprise_form_fields
-- Adds procurement-grade fields to Company, RFQ, Quote, Listing, Message, Conversation

-- ── Company: legal + compliance + supplier profile + admin ─────────────────────
ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "vatNumber"           TEXT,
  ADD COLUMN IF NOT EXISTS "crExpiryDate"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "legalForm"           TEXT,
  ADD COLUMN IF NOT EXISTS "establishmentYear"   INTEGER,
  ADD COLUMN IF NOT EXISTS "companySizeRange"    TEXT,
  ADD COLUMN IF NOT EXISTS "sectors"             TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "contactJobTitle"     TEXT,
  ADD COLUMN IF NOT EXISTS "coverImageUrl"       TEXT,
  ADD COLUMN IF NOT EXISTS "keyClients"          TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "regionsServed"       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "paymentTermsAccepted" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "productionCapacity"  TEXT,
  ADD COLUMN IF NOT EXISTS "isoUrl"              TEXT,
  ADD COLUMN IF NOT EXISTS "chamberCertUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "taxCertUrl"          TEXT,
  ADD COLUMN IF NOT EXISTS "adminNotes"          TEXT,
  ADD COLUMN IF NOT EXISTS "planExpiresAt"       TIMESTAMP(3);

-- ── RFQ: procurement fields ────────────────────────────────────────────────────
ALTER TABLE "RFQ"
  ADD COLUMN IF NOT EXISTS "projectType"              TEXT,
  ADD COLUMN IF NOT EXISTS "budgetMin"                DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "budgetMax"                DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "budgetUndisclosed"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "vatIncluded"              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "expectedStartDate"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "locationRequirement"      TEXT,
  ADD COLUMN IF NOT EXISTS "siteVisitRequired"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ndaRequired"              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiredCertifications"   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "visibility"               TEXT NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN IF NOT EXISTS "allowPartialBids"         BOOLEAN NOT NULL DEFAULT true;

-- ── Quote: commercial + technical fields ───────────────────────────────────────
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "vatPercent"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "paymentTerms"        TEXT,
  ADD COLUMN IF NOT EXISTS "warrantyMonths"      INTEGER,
  ADD COLUMN IF NOT EXISTS "afterSalesSupport"   TEXT,
  ADD COLUMN IF NOT EXISTS "technicalProposal"   TEXT,
  ADD COLUMN IF NOT EXISTS "lineItems"           JSONB;

-- ── Listing: product catalog fields ───────────────────────────────────────────
ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "sku"                 TEXT,
  ADD COLUMN IF NOT EXISTS "specsJson"           JSONB,
  ADD COLUMN IF NOT EXISTS "requestQuoteOnly"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "vatPercent"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "stockAvailability"   TEXT NOT NULL DEFAULT 'IN_STOCK';

-- ── Message: type + priority ──────────────────────────────────────────────────
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "messageType"         TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS "priority"            TEXT NOT NULL DEFAULT 'NORMAL';

-- ── Conversation: RFQ reference link ─────────────────────────────────────────
ALTER TABLE "Conversation"
  ADD COLUMN IF NOT EXISTS "rfqId"               TEXT;

/**
 * @mwazn/contracts — Platform Contract Layer
 *
 * Single source of truth for all shared platform types, enums, and constants
 * used by both the frontend and backend of the Mwazn marketplace.
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 * This is an npm workspace package (root package.json workspaces: ["packages/*"]).
 * Run `npm install` at the monorepo root to create the node_modules symlink.
 *
 * Frontend: "@mwazn/contracts": "*" in devDependencies + tsconfig.json path alias
 *           as a fallback for TypeScript resolution without a full npm install.
 *
 * Backend:  Prisma schema enums in apps/backend/prisma/schema.prisma are the
 *           authoritative runtime source for the backend. This file documents
 *           the expected values and serves as the shared reference.
 *           See apps/backend/src/common/constants/platform.constants.ts
 *           for backend-side role groupings that mirror these definitions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * All user roles supported by the Mwazn platform.
 *
 * - BUYER_ADMIN    Company buyer with CR — post RFQs, manage deals
 * - SUPPLIER_ADMIN Company seller with CR — list products, respond to RFQs
 * - PLATFORM_ADMIN Mwazn internal admin — full system access
 * - FREELANCER     Individual seller, no CR required — auto-verified
 * - CUSTOMER       Individual buyer, no CR required — instant access
 */
export type Role =
  | 'BUYER_ADMIN'
  | 'SUPPLIER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'FREELANCER'
  | 'CUSTOMER';

/** Roles that can act as sellers: list products, respond to RFQs */
export const SELLER_ROLES: Role[] = ['SUPPLIER_ADMIN', 'FREELANCER'];

/** Roles whose primary identity is as buyers (company.type === BUYER) */
export const BUYER_ROLES: Role[] = ['BUYER_ADMIN', 'CUSTOMER'];

/**
 * Roles that can post RFQs.
 * FREELANCER is a dual-role — they can both sell AND post RFQs.
 * Use this constant when checking RFQ creation permission rather than BUYER_ROLES.
 */
export const RFQ_POSTER_ROLES: Role[] = ['BUYER_ADMIN', 'CUSTOMER', 'FREELANCER'];

/** Roles with a company subscription plan (FREE/PRO) */
export const PLAN_ROLES: Role[] = ['SUPPLIER_ADMIN', 'BUYER_ADMIN'];

// ─── Company ──────────────────────────────────────────────────────────────────

export type CompanyType = 'BUYER' | 'SUPPLIER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type SubscriptionPlan = 'FREE' | 'PRO';

// ─── Listings ─────────────────────────────────────────────────────────────────

export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type StockAvailability = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED';

// ─── RFQs / Quotes / Deals ────────────────────────────────────────────────────

export type RFQStatus = 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type DealStatus =
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// ─── Messaging ────────────────────────────────────────────────────────────────

export type MessageType =
  | 'GENERAL'
  | 'CLARIFICATION'
  | 'NEGOTIATION'
  | 'TECHNICAL'
  | 'COMMERCIAL';

export type MessagePriority = 'NORMAL' | 'URGENT';

// ─── RFQ metadata ─────────────────────────────────────────────────────────────

export type RFQVisibility = 'PUBLIC' | 'INVITE_ONLY';

export type RFQProjectType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'MANUFACTURING'
  | 'CONSULTANCY';

// ─── Identity / Documents ─────────────────────────────────────────────────────

/**
 * Verification document types accepted by the Mwazn platform.
 * Maps directly to the Prisma DocumentType enum in the backend schema.
 */
export type DocumentType =
  | 'CR'
  | 'VAT'
  | 'LICENSE'
  | 'ISO'
  | 'OTHER'
  | 'NATIONAL_ID'
  | 'IQAMA'
  | 'BUSINESS_PLATFORM'
  | 'MAROOF';

/** Source used to verify a company identity (used with non-CR accounts) */
export type VerificationSource =
  | 'CR'
  | 'BUSINESS_PLATFORM'
  | 'MAROOF'
  | 'MANUAL';

/** Type of government-issued identity document */
export type GovernmentIdType = 'NATIONAL_ID' | 'IQAMA';

// ─── API response envelope ────────────────────────────────────────────────────

/**
 * Standard Mwazn API response envelope.
 *
 * All API responses conform to this shape:
 *   { success, data, message?, timestamp, meta? }
 */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Pagination metadata returned with all paginated API responses.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated API response — extends ApiEnvelope with pagination metadata.
 */
export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  meta: PaginationMeta;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

/** Content moderation state for RFQs and Listings */
export type ModerationStatus = 'ACTIVE' | 'FLAGGED' | 'REMOVED' | 'REJECTED';

/** Who triggered the moderation action */
export type ModerationSource = 'SYSTEM' | 'ADMIN';

/** Which content type an appeal targets */
export type AppealTargetType = 'RFQ' | 'LISTING';

/** Lifecycle state of a moderation appeal */
export type AppealStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CLOSED';

// ─── API response envelope ────────────────────────────────────────────────────

/**
 * Legacy alias — kept for backward compatibility with existing frontend consumers.
 * Prefer ApiEnvelope<T> in new code.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Legacy alias — kept for backward compatibility.
 * Prefer PaginatedEnvelope<T> in new code.
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

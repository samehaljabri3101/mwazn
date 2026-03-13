/**
 * @mwazn/contracts — Platform Contract Layer
 *
 * Single source of truth for all shared platform types, enums, and constants
 * used by both the frontend and backend of the Mwazn marketplace.
 *
 * ─── Usage ────────────────────────────────────────────────────────────────────
 * Frontend: imported via the `@mwazn/contracts` TypeScript path alias.
 *           See apps/frontend/tsconfig.json → compilerOptions.paths
 *
 * Backend:  Prisma schema enums in apps/backend/prisma/schema.prisma are the
 *           authoritative runtime source for the backend. This file documents
 *           the expected values and serves as the shared reference.
 *           See apps/backend/src/common/constants/platform.constants.ts
 *           for backend-side role groupings that mirror these definitions.
 *
 * ─── Migration path ───────────────────────────────────────────────────────────
 * When npm workspaces are set up at the monorepo root, this package can be
 * published as @mwazn/contracts and imported directly in both apps without
 * the path alias workaround.
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

/** Roles that can act as buyers: post RFQs, receive quotes */
export const BUYER_ROLES: Role[] = ['BUYER_ADMIN', 'CUSTOMER'];

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

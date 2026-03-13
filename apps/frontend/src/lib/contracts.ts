/**
 * Frontend-local contract type aliases.
 *
 * These mirror packages/contracts/src/index.ts but are inlined here so the
 * frontend Docker build (context: ./apps/frontend) doesn't need to resolve
 * the @mwazn/contracts workspace package from the npm registry.
 *
 * TypeScript path alias (@mwazn/contracts → packages/contracts/src) still
 * works in local development — this file is the fallback for Docker builds.
 *
 * Kept in sync with packages/contracts/src/index.ts manually.
 */

export type Role =
  | 'BUYER_ADMIN'
  | 'SUPPLIER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'FREELANCER'
  | 'CUSTOMER';

export const SELLER_ROLES: Role[] = ['SUPPLIER_ADMIN', 'FREELANCER'];
export const BUYER_ROLES: Role[] = ['BUYER_ADMIN', 'CUSTOMER'];
export const RFQ_POSTER_ROLES: Role[] = ['BUYER_ADMIN', 'CUSTOMER', 'FREELANCER'];
export const PLAN_ROLES: Role[] = ['SUPPLIER_ADMIN', 'BUYER_ADMIN'];

export type CompanyType = 'BUYER' | 'SUPPLIER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type SubscriptionPlan = 'FREE' | 'PRO';

export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type StockAvailability = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED';

export type RFQStatus = 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type DealStatus =
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type MessageType =
  | 'GENERAL'
  | 'CLARIFICATION'
  | 'NEGOTIATION'
  | 'TECHNICAL'
  | 'COMMERCIAL';

export type MessagePriority = 'NORMAL' | 'URGENT';

export type RFQVisibility = 'PUBLIC' | 'INVITE_ONLY';

export type RFQProjectType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'MANUFACTURING'
  | 'CONSULTANCY';

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

export type VerificationSource = 'CR' | 'BUSINESS_PLATFORM' | 'MAROOF' | 'MANUAL';

export type GovernmentIdType = 'NATIONAL_ID' | 'IQAMA';

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  meta: PaginationMeta;
}

/** Legacy alias — prefer ApiEnvelope<T> in new code */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/** Legacy alias — prefer PaginatedEnvelope<T> in new code */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

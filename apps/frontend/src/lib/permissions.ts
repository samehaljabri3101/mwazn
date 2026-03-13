/**
 * Permission guards — lightweight, pure role-permission functions.
 *
 * These guards encode the platform's access control rules in one place.
 * Import and call them in page guards, navigation visibility checks,
 * and conditional UI rendering to avoid duplicated inline role checks.
 *
 * Design principles:
 * - Each function answers one binary question about what a role CAN do.
 * - All functions accept nullable role/plan to safely handle loading states.
 * - No side effects — callers decide what to render or redirect to.
 *
 * Source of truth for role/plan types: @mwazn/contracts
 */
import type { Role, SubscriptionPlan } from '@mwazn/contracts';

// ─── Admin access ─────────────────────────────────────────────────────────────

/** Can access the platform admin dashboard and all admin sub-pages */
export function canAccessAdmin(role?: Role | null): boolean {
  return role === 'PLATFORM_ADMIN';
}

/** Can review and approve/reject company verification documents */
export function canAccessVerificationControls(role?: Role | null): boolean {
  return role === 'PLATFORM_ADMIN';
}

// ─── RFQ / Buying ─────────────────────────────────────────────────────────────

/** Can post a new RFQ (buyer roles: BUYER_ADMIN and CUSTOMER) */
export function canPostRFQ(role?: Role | null): boolean {
  return role === 'BUYER_ADMIN' || role === 'CUSTOMER';
}

/** Can view buyer-side analytics (procurement performance, requests, spend) */
export function canViewBuyerAnalytics(role?: Role | null): boolean {
  return role === 'BUYER_ADMIN' || role === 'CUSTOMER';
}

// ─── Listings / Selling ───────────────────────────────────────────────────────

/** Can create, edit, and delete product listings */
export function canManageProducts(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'FREELANCER';
}

/** Can submit quotes in response to RFQs */
export function canSubmitQuote(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'FREELANCER';
}

/** Can view seller-side analytics (listings performance, quotes, revenue) */
export function canViewSellerAnalytics(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'FREELANCER';
}

// ─── Plan-gated features ──────────────────────────────────────────────────────

/**
 * Can export analytics data as CSV.
 * Requires a subscription plan (BUYER_ADMIN or SUPPLIER_ADMIN) and PRO tier.
 * FREELANCER and CUSTOMER do not have plan-gated features.
 */
export function canExportAnalytics(
  role?: Role | null,
  plan?: SubscriptionPlan | null,
): boolean {
  return (role === 'SUPPLIER_ADMIN' || role === 'BUYER_ADMIN') && plan === 'PRO';
}

/**
 * Can upgrade to a PRO subscription.
 * Only business (CR-backed) roles have subscription plans.
 */
export function canUpgradePlan(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'BUYER_ADMIN';
}

// ─── Compound helpers ─────────────────────────────────────────────────────────

/**
 * Returns the allowed analytics direction for a role.
 * Used to determine which analytics endpoint to fetch and which component to render.
 *
 * Returns 'seller' | 'buyer' | 'admin' | null (null = loading or unknown role).
 */
export function getAnalyticsMode(
  role?: Role | null,
): 'seller' | 'buyer' | 'admin' | null {
  if (role === 'PLATFORM_ADMIN') return 'admin';
  if (role === 'SUPPLIER_ADMIN' || role === 'FREELANCER') return 'seller';
  if (role === 'BUYER_ADMIN' || role === 'CUSTOMER') return 'buyer';
  return null;
}

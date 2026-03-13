/**
 * Supplier domain helpers — display utilities for supplier scores,
 * subscription plans, and supplier-type presentation.
 *
 * The platform supplier score is a 0–100 composite metric.
 * The avg rating is a 1–5 customer rating (null = no ratings yet).
 *
 * Source of truth for type values: @mwazn/contracts
 */
import type { Role, SubscriptionPlan } from '@/lib/contracts';

// ─── Supplier Score (0–100) ───────────────────────────────────────────────────

export type ScoreTier = 'high' | 'medium' | 'low';

/**
 * Buckets the 0–100 platform score into a display tier.
 * Returns null when the score is unavailable.
 */
export function getScoreTier(score?: number | null): ScoreTier | null {
  if (score == null) return null;
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Tailwind color class pair for the given score tier */
export function getScoreTierColor(score?: number | null): string {
  const tier = getScoreTier(score);
  switch (tier) {
    case 'high':   return 'text-green-700';
    case 'medium': return 'text-yellow-700';
    case 'low':    return 'text-red-700';
    default:       return 'text-gray-400';
  }
}

/** Tailwind background + text class for a score badge */
export function getScoreTierBadgeColor(score?: number | null): string {
  const tier = getScoreTier(score);
  switch (tier) {
    case 'high':   return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low':    return 'bg-red-100 text-red-700';
    default:       return 'bg-gray-100 text-gray-500';
  }
}

/** Human-readable tier label */
export function getScoreTierLabel(score?: number | null, ar = false): string {
  const tier = getScoreTier(score);
  switch (tier) {
    case 'high':   return ar ? 'ممتاز' : 'Excellent';
    case 'medium': return ar ? 'جيد'   : 'Good';
    case 'low':    return ar ? 'منخفض' : 'Low';
    default:       return ar ? 'غير محدد' : 'Not rated';
  }
}

// ─── Subscription Plan ────────────────────────────────────────────────────────

export function isPlanPro(plan?: SubscriptionPlan | null): boolean {
  return plan === 'PRO';
}

export function getPlanLabel(plan?: SubscriptionPlan | null, ar = false): string {
  if (plan === 'PRO') return ar ? 'احترافي' : 'PRO';
  return ar ? 'مجاني' : 'Free';
}

export function getPlanBadgeColor(plan?: SubscriptionPlan | null): string {
  return plan === 'PRO'
    ? 'bg-purple-100 text-purple-800'
    : 'bg-gray-100 text-gray-600';
}

// ─── Supplier type presentation ───────────────────────────────────────────────

/**
 * Returns the supplier-facing type label for a role.
 * SUPPLIER_ADMIN is a "Business Supplier", FREELANCER is an "Independent Seller".
 */
export function getSupplierTypeLabel(role?: Role | null, ar = false): string {
  switch (role) {
    case 'SUPPLIER_ADMIN': return ar ? 'مورّد تجاري' : 'Business Supplier';
    case 'FREELANCER':     return ar ? 'بائع مستقل'  : 'Independent Seller';
    default:               return ar ? 'مورّد'       : 'Supplier';
  }
}

/**
 * True for roles that require a CR (Commercial Registration) document.
 * Used to show/hide CR-related UI elements.
 */
export function isCRRequired(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'BUYER_ADMIN';
}

/**
 * Returns the avg rating as a display string (e.g. "4.3") or null.
 * Rounds to 1 decimal place.
 */
export function formatAvgRating(avgRating?: number | null): string | null {
  if (avgRating == null) return null;
  return avgRating.toFixed(1);
}

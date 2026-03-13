/**
 * Role helpers — frontend role-awareness utilities.
 *
 * Centralizes all role-based logic that was previously duplicated inline
 * across analytics/page.tsx, Navbar.tsx, HomeSections.tsx, dashboard/page.tsx,
 * and register/page.tsx.
 *
 * Source of truth for role groupings: packages/contracts/src/index.ts
 */
import type { Role } from '@mwazn/contracts';

// ─── Role group predicates ────────────────────────────────────────────────────

/** True for roles that can sell: list products, respond to RFQs */
export function isSellerRole(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'FREELANCER';
}

/** True for roles that can buy: post RFQs, receive quotes */
export function isBuyerRole(role?: Role | null): boolean {
  return role === 'BUYER_ADMIN' || role === 'CUSTOMER';
}

/** True for PLATFORM_ADMIN */
export function isAdminRole(role?: Role | null): boolean {
  return role === 'PLATFORM_ADMIN';
}

/** True for FREELANCER specifically */
export function isFreelancerRole(role?: Role | null): boolean {
  return role === 'FREELANCER';
}

/** True for CUSTOMER specifically */
export function isCustomerRole(role?: Role | null): boolean {
  return role === 'CUSTOMER';
}

/**
 * True for business (CR-backed) accounts: SUPPLIER_ADMIN or BUYER_ADMIN.
 * These roles have subscription plans (FREE/PRO) and CR verification.
 */
export function isBusinessRole(role?: Role | null): boolean {
  return role === 'SUPPLIER_ADMIN' || role === 'BUYER_ADMIN';
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

/**
 * Returns the dashboard root path for a given role.
 *
 * Centralizes the admin-vs-standard dashboard branch that was previously
 * duplicated in Navbar.tsx, HomeSections.tsx, and the auth register page.
 *
 * @example
 *   getRoleDashboardPath('PLATFORM_ADMIN', 'en')  // '/en/dashboard/admin'
 *   getRoleDashboardPath('SUPPLIER_ADMIN', 'ar')  // '/ar/dashboard'
 */
export function getRoleDashboardPath(role?: Role | null, locale = 'en'): string {
  return `/${locale}/dashboard${role === 'PLATFORM_ADMIN' ? '/admin' : ''}`;
}

/**
 * Returns a human-readable account type label for a role.
 * Used in dashboard subtitles, profile pages, and admin views.
 */
export function getRoleLabel(role?: Role | null, ar = false): string {
  switch (role) {
    // Both CR-backed roles are unified under the "Business" account model
    case 'SUPPLIER_ADMIN': return ar ? 'حساب شركة' : 'Business Account';
    case 'BUYER_ADMIN':    return ar ? 'حساب شركة' : 'Business Account';
    case 'PLATFORM_ADMIN': return ar ? 'مدير المنصة' : 'Platform Admin';
    case 'FREELANCER':     return ar ? 'بائع مستقل'  : 'Independent Seller';
    case 'CUSTOMER':       return ar ? 'مشترٍ فردي'  : 'Individual Buyer';
    default:               return ar ? 'مستخدم'      : 'User';
  }
}

/**
 * Returns the analytics page title for a role.
 */
export function getAnalyticsTitle(role?: Role | null, ar = false): string {
  if (role === 'FREELANCER') return ar ? 'إحصائيات البيع' : 'Seller Analytics';
  if (role === 'CUSTOMER')   return ar ? 'نشاطي'          : 'My Activity';
  return ar ? 'التحليلات' : 'Analytics';
}

/**
 * Returns the analytics page subtitle for a role.
 */
export function getAnalyticsSubtitle(role?: Role | null, ar = false): string {
  if (role === 'FREELANCER') return ar
    ? 'أداء مبيعاتك عبر المنتجات والعروض والصفقات'
    : 'Your sales performance across listings, quotes, and deals';
  if (role === 'CUSTOMER') return ar
    ? 'نشاط شرائك عبر الطلبات والعروض والصفقات'
    : 'Your buying activity across requests, quotes, and orders';
  if (isSellerRole(role)) return ar
    ? 'مؤشرات أداء نشاطك التجاري'
    : 'Business performance insights';
  return ar ? 'مؤشرات أداء المشتريات' : 'Procurement performance insights';
}

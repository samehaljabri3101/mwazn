/**
 * RFQ domain helpers — display utilities for RFQ, Quote, and Deal statuses.
 *
 * All functions are pure, locale-aware, and return Tailwind CSS class strings
 * so they can be used directly in JSX without additional mapping.
 *
 * Source of truth for status type values: @mwazn/contracts
 */
import type { RFQStatus, QuoteStatus, DealStatus } from '@/lib/contracts';

// ─── RFQ Status ───────────────────────────────────────────────────────────────

export function getRFQStatusLabel(status: RFQStatus, ar = false): string {
  const labels: Record<RFQStatus, [string, string]> = {
    OPEN:      ['Open',      'مفتوح'],
    CLOSED:    ['Closed',    'مغلق'],
    AWARDED:   ['Awarded',   'تم الترسية'],
    CANCELLED: ['Cancelled', 'ملغى'],
  };
  const [en, arLabel] = labels[status] ?? ['Unknown', 'غير معروف'];
  return ar ? arLabel : en;
}

export function getRFQStatusColor(status: RFQStatus): string {
  switch (status) {
    case 'OPEN':      return 'bg-green-100 text-green-800';
    case 'CLOSED':    return 'bg-gray-100 text-gray-700';
    case 'AWARDED':   return 'bg-blue-100 text-blue-800';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    default:          return 'bg-gray-100 text-gray-500';
  }
}

/** True while the RFQ can still receive quotes */
export function isRFQActive(status: RFQStatus): boolean {
  return status === 'OPEN';
}

/** True once the RFQ has reached a terminal state */
export function isRFQFinal(status: RFQStatus): boolean {
  return status === 'AWARDED' || status === 'CANCELLED' || status === 'CLOSED';
}

// ─── Quote Status ─────────────────────────────────────────────────────────────

export function getQuoteStatusLabel(status: QuoteStatus, ar = false): string {
  const labels: Record<QuoteStatus, [string, string]> = {
    PENDING:   ['Pending',   'قيد الانتظار'],
    ACCEPTED:  ['Accepted',  'مقبول'],
    REJECTED:  ['Rejected',  'مرفوض'],
    WITHDRAWN: ['Withdrawn', 'منسحب'],
  };
  const [en, arLabel] = labels[status] ?? ['Unknown', 'غير معروف'];
  return ar ? arLabel : en;
}

export function getQuoteStatusColor(status: QuoteStatus): string {
  switch (status) {
    case 'PENDING':   return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':  return 'bg-green-100 text-green-800';
    case 'REJECTED':  return 'bg-red-100 text-red-700';
    case 'WITHDRAWN': return 'bg-gray-100 text-gray-500';
    default:          return 'bg-gray-100 text-gray-500';
  }
}

/** True while the quote is still actionable */
export function isQuoteActive(status: QuoteStatus): boolean {
  return status === 'PENDING';
}

// ─── Deal Status ──────────────────────────────────────────────────────────────

export function getDealStatusLabel(status: DealStatus, ar = false): string {
  const labels: Record<DealStatus, [string, string]> = {
    AWARDED:     ['Awarded',     'تم الترسية'],
    IN_PROGRESS: ['In Progress', 'جارٍ التنفيذ'],
    DELIVERED:   ['Delivered',   'تم التسليم'],
    COMPLETED:   ['Completed',   'مكتمل'],
    CANCELLED:   ['Cancelled',   'ملغى'],
  };
  const [en, arLabel] = labels[status] ?? ['Unknown', 'غير معروف'];
  return ar ? arLabel : en;
}

export function getDealStatusColor(status: DealStatus): string {
  switch (status) {
    case 'AWARDED':     return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
    case 'DELIVERED':   return 'bg-teal-100 text-teal-800';
    case 'COMPLETED':   return 'bg-green-100 text-green-800';
    case 'CANCELLED':   return 'bg-red-100 text-red-700';
    default:            return 'bg-gray-100 text-gray-500';
  }
}

/** True while the deal is still in an active (non-terminal) state */
export function isDealActive(status: DealStatus): boolean {
  return status === 'AWARDED' || status === 'IN_PROGRESS' || status === 'DELIVERED';
}

/** True once the deal has reached a final (terminal) state */
export function isDealFinal(status: DealStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/**
 * Returns the 0-based step index for a deal in the deal stepper UI.
 * Matches the order: Awarded → In Progress → Delivered → Completed
 */
export function getDealStep(status: DealStatus): number {
  switch (status) {
    case 'AWARDED':     return 0;
    case 'IN_PROGRESS': return 1;
    case 'DELIVERED':   return 2;
    case 'COMPLETED':   return 3;
    case 'CANCELLED':   return -1;
    default:            return 0;
  }
}

/**
 * Verification domain helpers — display utilities for document types,
 * verification statuses, and verification sources.
 *
 * Used in admin company pages, supplier showrooms, registration flows,
 * and dashboard verification alerts.
 *
 * Source of truth for type values: @mwazn/contracts
 */
import type { DocumentType, VerificationStatus, VerificationSource } from '@mwazn/contracts';

// ─── Document Type Labels ─────────────────────────────────────────────────────

export function getDocumentTypeLabel(type: DocumentType, ar = false): string {
  const labels: Record<DocumentType, [string, string]> = {
    CR:                ['Commercial Registration',  'السجل التجاري'],
    VAT:               ['VAT Certificate',          'شهادة ضريبة القيمة المضافة'],
    LICENSE:           ['Business License',         'الرخصة التجارية'],
    ISO:               ['ISO / Quality Certificate','شهادة الجودة / ISO'],
    OTHER:             ['Other Document',           'وثيقة أخرى'],
    NATIONAL_ID:       ['National ID / Iqama',      'الهوية الوطنية / الإقامة'],
    IQAMA:             ['Iqama (Residency)',         'الإقامة'],
    BUSINESS_PLATFORM: ['Business Platform Proof',  'إثبات منصة الأعمال'],
    MAROOF:            ['Maroof Certificate',       'شهادة معروف'],
  };
  const [en, arLabel] = labels[type] ?? ['Document', 'وثيقة'];
  return ar ? arLabel : en;
}

// ─── Verification Status ──────────────────────────────────────────────────────

export function getVerificationStatusLabel(status: VerificationStatus, ar = false): string {
  switch (status) {
    case 'PENDING':  return ar ? 'مراجعة السجل التجاري' : 'CR Doc Under Review';
    case 'VERIFIED': return ar ? 'سجل تجاري موثّق'      : 'CR Verified';
    case 'REJECTED': return ar ? 'مرفوض'                : 'Rejected';
    default:         return ar ? 'غير معروف'             : 'Unknown';
  }
}

export function getVerificationStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-800';
    case 'PENDING':  return 'bg-yellow-100 text-yellow-800';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    default:         return 'bg-gray-100 text-gray-500';
  }
}

/** True if a company has passed verification */
export function isVerified(status?: VerificationStatus | null): boolean {
  return status === 'VERIFIED';
}

/** True if verification is waiting for review */
export function isPendingVerification(status?: VerificationStatus | null): boolean {
  return status === 'PENDING';
}

// ─── Verification Source Labels ───────────────────────────────────────────────

export function getVerificationSourceLabel(source: VerificationSource, ar = false): string {
  switch (source) {
    case 'CR':                return ar ? 'سجل تجاري'              : 'Commercial Registration';
    case 'BUSINESS_PLATFORM': return ar ? 'منصة الأعمال السعودية'  : 'Saudi Business Platform';
    case 'MAROOF':            return ar ? 'منصة معروف'              : 'Maroof Platform';
    case 'MANUAL':            return ar ? 'مراجعة يدوية'            : 'Manual Review';
    default:                  return ar ? 'غير محدد'                : 'Unknown';
  }
}

// ─── Compound badge helpers ───────────────────────────────────────────────────

/**
 * Returns a display badge for a company's verification state, or null if
 * the company is not yet verified (no badge shown for PENDING).
 *
 * Used in supplier cards, showrooms, and search results.
 */
export function getVerificationBadge(
  status?: VerificationStatus | null,
  ar = false,
): { label: string; color: string } | null {
  if (status === 'VERIFIED') {
    return {
      label: ar ? 'سجل تجاري موثّق' : 'CR Verified',
      color: 'bg-green-100 text-green-800',
    };
  }
  if (status === 'PENDING') {
    return {
      label: ar ? 'مراجعة السجل التجاري' : 'CR Doc Under Review',
      color: 'bg-yellow-100 text-yellow-800',
    };
  }
  return null;
}

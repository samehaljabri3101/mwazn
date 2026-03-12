import type { Company } from '@/types';

// ─── Extended types ────────────────────────────────────────────────────────────

export interface VerificationDoc {
  id: string;
  type: string;       // CR | VAT | LICENSE | ISO | OTHER
  fileUrl: string;
  uploadedAt: string;
  decision: string | null;   // APPROVED | REJECTED | null
  notes: string | null;
}

export interface CompanyWithDocs extends Company {
  verificationDocs?: VerificationDoc[];
  _count?: {
    users: number;
    listings: number;
    rfqs: number;
    quotesSubmitted: number;
    dealsAsBuyer: number;
    dealsAsSupplier: number;
    ratingsReceived: number;
  };
}

// ─── Filter / sort state ───────────────────────────────────────────────────────

export interface FilterState {
  search: string;
  type: '' | 'BUYER' | 'SUPPLIER';
  status: '' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  plan: '' | 'FREE' | 'PRO';
  sort: 'newest' | 'oldest' | 'name' | 'cr_expiry';
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  type: '',
  status: '',
  plan: '',
  sort: 'newest',
};

// ─── Warning flags ─────────────────────────────────────────────────────────────

export type WarningCode =
  | 'NO_DOCUMENTS'       // supplier pending with no uploaded docs
  | 'CR_EXPIRED'         // CR expiry date is in the past
  | 'CR_EXPIRING_SOON'   // CR expiry within 30 days
  | 'MISSING_PHONE'      // no phone number
  | 'MISSING_CITY'       // no city
  | 'INACTIVE';          // isActive === false

export function getWarnings(c: CompanyWithDocs): WarningCode[] {
  const flags: WarningCode[] = [];
  if (!c.isActive) flags.push('INACTIVE');
  if (c.type === 'SUPPLIER' && c.verificationStatus === 'PENDING') {
    if (!c.verificationDocs || c.verificationDocs.length === 0) flags.push('NO_DOCUMENTS');
  }
  if (c.crExpiryDate) {
    const now = new Date();
    const exp = new Date(c.crExpiryDate);
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / 86_400_000);
    if (daysLeft < 0) flags.push('CR_EXPIRED');
    else if (daysLeft <= 30) flags.push('CR_EXPIRING_SOON');
  }
  if (!c.phone) flags.push('MISSING_PHONE');
  if (!c.city) flags.push('MISSING_CITY');
  return flags;
}

export function hasCriticalWarning(flags: WarningCode[]): boolean {
  return flags.includes('CR_EXPIRED') || flags.includes('INACTIVE') || flags.includes('NO_DOCUMENTS');
}

// ─── Effective UI status ───────────────────────────────────────────────────────

export interface EffectiveStatus {
  key: string;
  labelEn: string;
  labelAr: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}

export function getEffectiveStatus(c: CompanyWithDocs): EffectiveStatus {
  if (!c.isActive) return { key: 'inactive',      labelEn: 'Inactive',         labelAr: 'غير نشط',        color: 'gray'  };
  if (c.verificationStatus === 'VERIFIED') return { key: 'verified',     labelEn: 'Verified',         labelAr: 'موثّق',          color: 'green' };
  if (c.verificationStatus === 'REJECTED') return { key: 'rejected',     labelEn: 'Rejected',         labelAr: 'مرفوض',          color: 'red'   };
  // PENDING
  const hasDocs = (c.verificationDocs?.length ?? 0) > 0;
  if (!hasDocs) return { key: 'missing_docs',  labelEn: 'Missing Docs',     labelAr: 'وثائق مفقودة',   color: 'amber' };
  return             { key: 'under_review',  labelEn: 'Under Review',     labelAr: 'قيد المراجعة',   color: 'blue'  };
}

// ─── Filter + sort logic ───────────────────────────────────────────────────────

export function applyFilters(companies: CompanyWithDocs[], f: FilterState): CompanyWithDocs[] {
  let list = companies;

  if (f.type)   list = list.filter((c) => c.type === f.type);
  if (f.status) list = list.filter((c) => c.verificationStatus === f.status);
  if (f.plan)   list = list.filter((c) => c.plan === f.plan);

  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter((c) =>
      (c.nameEn + ' ' + c.nameAr).toLowerCase().includes(q) ||
      (c.crNumber ?? '').toLowerCase().includes(q) ||
      (c.vatNumber ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q),
    );
  }

  return [...list].sort((a, b) => {
    if (f.sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (f.sort === 'name')   return (a.nameEn || a.nameAr).localeCompare(b.nameEn || b.nameAr);
    if (f.sort === 'cr_expiry') {
      if (!a.crExpiryDate) return 1;
      if (!b.crExpiryDate) return -1;
      return new Date(a.crExpiryDate).getTime() - new Date(b.crExpiryDate).getTime();
    }
    // default: newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ─── Date formatting ───────────────────────────────────────────────────────────

export function fmtDate(d?: string | null, locale = 'en'): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Currency formatting ───────────────────────────────────────────────────────

export function fmtCurrency(amount: number, currency = 'SAR'): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Plan status (derived from planExpiresAt) ──────────────────────────────────

export interface PlanStatus {
  key: 'active' | 'expiring_soon' | 'expired' | 'no_expiry';
  labelEn: string;
  labelAr: string;
  color: 'green' | 'amber' | 'red' | 'gray';
}

export function getPlanStatus(c: CompanyWithDocs): PlanStatus {
  if (c.plan === 'FREE') {
    return { key: 'active', labelEn: 'Free Plan', labelAr: 'الخطة المجانية', color: 'gray' };
  }
  if (!c.planExpiresAt) {
    return { key: 'no_expiry', labelEn: 'Active', labelAr: 'نشط', color: 'green' };
  }
  const daysLeft = Math.floor((new Date(c.planExpiresAt).getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0)   return { key: 'expired',       labelEn: 'Expired',        labelAr: 'منتهٍ',         color: 'red'   };
  if (daysLeft <= 30) return { key: 'expiring_soon',  labelEn: 'Expiring Soon',  labelAr: 'ينتهي قريباً', color: 'amber' };
  return               { key: 'active',              labelEn: 'Active',         labelAr: 'نشط',          color: 'green' };
}

export function getPlanDaysLeft(c: CompanyWithDocs): number | null {
  if (!c.planExpiresAt) return null;
  return Math.floor((new Date(c.planExpiresAt).getTime() - Date.now()) / 86_400_000);
}

// ─── Required documents checklist (informational) ────────────────────────────

export const REQUIRED_DOCS_CHECKLIST = [
  { key: 'CR',      labelEn: 'Commercial Registration',         labelAr: 'السجل التجاري',                    required: true  },
  { key: 'VAT',     labelEn: 'VAT Certificate',                  labelAr: 'شهادة ضريبة القيمة المضافة',       required: true  },
  { key: 'LICENSE', labelEn: 'Business License',                  labelAr: 'الرخصة التجارية',                  required: false },
  { key: 'ISO',     labelEn: 'ISO / Quality Certificate',         labelAr: 'شهادة الجودة / ISO',               required: false },
] as const;

export const DOC_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  CR:      { en: 'Commercial Registration',   ar: 'السجل التجاري'                 },
  VAT:     { en: 'VAT Certificate',            ar: 'شهادة ضريبة القيمة المضافة'   },
  LICENSE: { en: 'Business License',           ar: 'الرخصة التجارية'              },
  ISO:     { en: 'ISO / Quality Certificate',  ar: 'شهادة الجودة / ISO'           },
  OTHER:   { en: 'Other Document',             ar: 'وثيقة أخرى'                   },
};

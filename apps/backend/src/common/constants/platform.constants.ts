/**
 * Platform-wide constants for the Mwazn marketplace backend.
 *
 * These constants mirror the contract definitions in packages/contracts/src/index.ts
 * for use across backend modules. The Prisma-generated Role enum is the
 * authoritative runtime type; these arrays are for runtime filtering/grouping.
 *
 * @example
 *   import { SELLER_ROLES } from '@/common/constants/platform.constants';
 *   if (SELLER_ROLES.includes(user.role)) { ... }
 */
import { Role } from '@prisma/client';

/** Roles that can act as sellers: list products, respond to RFQs */
export const SELLER_ROLES: Role[] = [Role.SUPPLIER_ADMIN, Role.FREELANCER];

/** Roles that can act as buyers: post RFQs, receive quotes */
export const BUYER_ROLES: Role[] = [Role.BUYER_ADMIN, Role.CUSTOMER];

/**
 * Roles with a company subscription plan (FREE/PRO).
 * FREELANCER and CUSTOMER do not have subscription-gated features.
 */
export const PLAN_ROLES: Role[] = [Role.SUPPLIER_ADMIN, Role.BUYER_ADMIN];

/**
 * Document type labels for use in admin views, email templates, and
 * verification workflows. Mirrors DOC_TYPE_LABELS in the frontend admin utils.
 */
export const DOCUMENT_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  CR:                { en: 'Commercial Registration',   ar: 'السجل التجاري'                   },
  VAT:               { en: 'VAT Certificate',            ar: 'شهادة ضريبة القيمة المضافة'      },
  LICENSE:           { en: 'Business License',           ar: 'الرخصة التجارية'                 },
  ISO:               { en: 'ISO / Quality Certificate',  ar: 'شهادة الجودة / ISO'              },
  OTHER:             { en: 'Other Document',             ar: 'وثيقة أخرى'                      },
  NATIONAL_ID:       { en: 'National ID / Iqama',        ar: 'الهوية الوطنية / الإقامة'        },
  IQAMA:             { en: 'Iqama (Residency)',           ar: 'الإقامة'                         },
  BUSINESS_PLATFORM: { en: 'Business Platform Proof',    ar: 'إثبات منصة الأعمال'              },
  MAROOF:            { en: 'Maroof Certificate',         ar: 'شهادة معروف'                     },
};

/**
 * Verification source labels for admin display.
 */
export const VERIFICATION_SOURCE_LABELS: Record<string, { en: string; ar: string }> = {
  CR:                { en: 'Commercial Registration',   ar: 'سجل تجاري'             },
  BUSINESS_PLATFORM: { en: 'Saudi Business Platform',   ar: 'منصة الأعمال السعودية'  },
  MAROOF:            { en: 'Maroof Platform',            ar: 'منصة معروف'             },
  MANUAL:            { en: 'Manual Review',              ar: 'مراجعة يدوية'           },
};

'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FileText, Building2 } from 'lucide-react';

/**
 * Public hero call-to-action buttons (logged-out users only).
 * Auth-aware rendering is handled by HomeSections — this component is kept
 * as a standalone embed for any future use outside the main homepage.
 */
export function HeroCTA() {
  const locale = useLocale();
  const ar = locale === 'ar';

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
      <Link
        href={`/${locale}/auth/register?type=BUYER`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
      >
        <FileText className="h-4 w-4" />
        {ar ? 'ابدأ طلب عرض سعر — مجاناً' : 'Post an RFQ — Free'}
      </Link>
      <Link
        href={`/${locale}/auth/register?type=SUPPLIER`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
      >
        <Building2 className="h-4 w-4" />
        {ar ? 'انضم كمورّد' : 'Join as Supplier'}
      </Link>
    </div>
  );
}

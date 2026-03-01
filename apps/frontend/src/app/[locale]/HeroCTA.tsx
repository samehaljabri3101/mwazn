'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Building2 } from 'lucide-react';

export function HeroCTA() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const { user, company, isLoading } = useAuth();

  let rfqHref = `/${locale}/auth/login`;
  if (!isLoading && user) {
    rfqHref = company?.type === 'SUPPLIER'
      ? `/${locale}/dashboard/supplier/rfqs`
      : `/${locale}/dashboard/buyer/rfqs/new`;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
      <Link
        href={rfqHref}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lift hover:bg-slate-50 transition-all hover:-translate-y-0.5"
      >
        <FileText className="h-4 w-4" />
        {ar ? 'ابدأ طلب عرض سعر' : 'Start an RFQ'}
      </Link>
      <Link
        href={`/${locale}/suppliers`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all hover:-translate-y-0.5 backdrop-blur"
      >
        <Building2 className="h-4 w-4" />
        {ar ? 'استكشف الموردين' : 'Explore Suppliers'}
      </Link>
    </div>
  );
}

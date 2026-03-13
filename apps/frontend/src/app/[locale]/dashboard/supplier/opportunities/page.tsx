'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { Calendar, Tag, MapPin, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline?: string;
  budget?: number;
  currency: string;
  locationRequirement?: string;
  category?: { nameEn: string; nameAr: string };
  buyer?: { nameEn: string; nameAr: string; city?: string };
  createdAt: string;
}

export default function SupplierOpportunitiesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/matching/supplier/opportunities')
      .then((res) => {
        setOpportunities(res.data.data || res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {ar ? 'الفرص المتاحة' : 'Matching Opportunities'}
            </h1>
            <p className="text-sm text-slate-400">
              {ar
                ? 'طلبات عروض أسعار مفتوحة تتطابق مع منتجاتك'
                : 'Open RFQs matching your product categories'}
            </p>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="card text-center py-16">
            <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="font-medium text-slate-600">
              {ar ? 'لا توجد فرص متاحة حالياً' : 'No matching opportunities at the moment'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {ar
                ? 'أضف منتجات إلى حسابك لتظهر الفرص المناسبة'
                : 'Add products to your profile to see matching RFQs'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((rfq) => (
              <Link
                key={rfq.id}
                href={`/${locale}/dashboard/supplier/rfqs/${rfq.id}`}
                className="block card hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {rfq.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                        <Zap className="h-2.5 w-2.5" />
                        {ar ? 'يتطابق' : 'Match'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                      {rfq.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {rfq.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {ar ? rfq.category.nameAr : rfq.category.nameEn}
                        </span>
                      )}
                      {(rfq.buyer?.city || rfq.locationRequirement) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {rfq.buyer?.city || rfq.locationRequirement}
                        </span>
                      )}
                      {rfq.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {ar ? 'الموعد النهائي:' : 'Deadline:'}{' '}
                          {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                        </span>
                      )}
                      <span className="text-slate-300">
                        {ar ? 'نُشر' : 'Posted'}{' '}
                        {format(new Date(rfq.createdAt), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-end">
                    {rfq.budget && (
                      <p className="font-bold text-brand-700 text-sm">
                        {rfq.budget.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          {rfq.currency}
                        </span>
                      </p>
                    )}
                    <Badge variant="green" className="mt-1">
                      {ar ? 'مفتوح' : 'Open'}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

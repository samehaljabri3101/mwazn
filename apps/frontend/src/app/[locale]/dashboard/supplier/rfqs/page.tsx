'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RFQ, PaginatedResponse, Category } from '@/types';
import { FileText, Calendar, Tag, DollarSign, Package, Search, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function SupplierBrowseRFQsPage() {
  const locale = useLocale();
  const { company } = useAuth();
  const ar = locale === 'ar';

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [total, setTotal] = useState(0);

  const isUnverified = company?.verificationStatus !== 'VERIFIED';

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data?.items || res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/rfqs', {
      params: {
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        status: 'OPEN',
        limit: 30,
      },
    }).then((res) => {
      const data: PaginatedResponse<RFQ> = res.data.data;
      setRfqs(data.items);
      setTotal(data.meta.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [search, categoryFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? 'طلبات عروض الأسعار المفتوحة' : 'Open RFQs'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ar ? `${total} طلب مفتوح — قدّم عرضك الأن` : `${total} open requests — submit your best offer`}
          </p>
        </div>

        {/* Verification warning */}
        {isUnverified && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">{ar ? 'حسابك غير موثق' : 'Account Not Yet Verified'}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {ar ? 'يمكنك الاطلاع على الطلبات لكن لا يمكنك تقديم عروض حتى يتم التحقق من شركتك.' : 'You can browse RFQs but cannot submit quotes until your company is verified.'}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? 'بحث في الطلبات...' : 'Search RFQs...'}
              className="input-base ps-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-base sm:w-56"
          >
            <option value="">{ar ? 'جميع الفئات' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>
            ))}
          </select>
        </div>

        {/* RFQ list */}
        {loading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : rfqs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={ar ? 'لا توجد طلبات مفتوحة' : 'No open RFQs'}
            description={ar ? 'لا توجد طلبات تطابق بحثك' : 'No requests match your search'}
          />
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="card card-hover">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{rfq.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{rfq.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                        {rfq.buyer && (
                          <span>{ar ? rfq.buyer.nameAr : rfq.buyer.nameEn}</span>
                        )}
                        {rfq.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {ar ? rfq.category.nameAr : rfq.category.nameEn}
                          </span>
                        )}
                        {rfq.quantity && rfq.unit && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {rfq.quantity} {rfq.unit}
                          </span>
                        )}
                        {rfq.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {rfq.budget.toLocaleString()} SAR
                          </span>
                        )}
                        {rfq.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                          </span>
                        )}
                        <Badge variant="green">
                          {ar ? `${rfq._count?.quotes ?? 0} عرض` : `${rfq._count?.quotes ?? 0} quotes`}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Link href={`/${locale}/dashboard/supplier/rfqs/${rfq.id}`}>
                    <Button
                      size="sm"
                      disabled={isUnverified}
                      className="whitespace-nowrap"
                    >
                      {ar ? 'تقديم عرض' : 'Submit Quote'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

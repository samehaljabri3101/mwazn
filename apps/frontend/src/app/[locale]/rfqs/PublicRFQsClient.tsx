'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FileText, Search, Clock, Tag, Package } from 'lucide-react';
import { format } from 'date-fns';

interface RFQItem {
  id: string;
  title: string;
  description: string;
  quantity?: number;
  unit?: string;
  budget?: number;
  currency: string;
  deadline?: string;
  status: string;
  category: { id: string; nameAr: string; nameEn: string };
  buyer: { id: string; nameAr: string; nameEn: string; city?: string };
  _count: { quotes: number };
  createdAt: string;
}

export default function PublicRFQsClient() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';
  const { user } = useAuth();

  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 12;

  const fetchRFQs = async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await api.get('/rfqs', {
        params: { status: 'OPEN', search: q || undefined, page: p, limit: LIMIT },
      });
      const data = res.data.data;
      setRfqs(data?.items || []);
      setTotal(data?.meta?.total || 0);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchRFQs(search, page); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRFQs(search, 1);
  };

  const handleQuoteClick = (rfqId: string) => {
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/rfqs/${rfqId}`);
    } else {
      router.push(`/${locale}/rfqs/${rfqId}`);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 pt-20 pb-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {ar ? 'طلبات عروض الأسعار المفتوحة' : 'Open Procurement Requests'}
          </h1>
          <p className="text-white/70 text-base mb-8">
            {ar
              ? 'تصفح طلبات المشترين المعتمدين وقدّم عرض سعرك التنافسي'
              : 'Browse RFQs from verified Saudi buyers and submit competitive quotes'}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? 'ابحث عن طلبات...' : 'Search RFQs...'}
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm bg-white border-0 shadow-md focus:ring-2 focus:ring-white/30 rtl:pl-4 rtl:pr-10"
              />
            </div>
            <button type="submit" className="rounded-xl bg-white text-brand-700 font-semibold px-5 py-3 text-sm hover:bg-brand-50 transition-colors">
              {ar ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {ar ? `${total} طلب مفتوح` : `${total} open requests`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse h-48">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : rfqs.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{ar ? 'لا توجد طلبات مفتوحة حالياً' : 'No open RFQs at the moment'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="card card-hover flex flex-col gap-3 group">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    <Tag className="h-3 w-3" />
                    {ar ? rfq.category.nameAr : rfq.category.nameEn}
                  </span>
                  <span className="ms-auto rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {rfq._count.quotes} {ar ? 'عرض' : 'quotes'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-brand-700 transition-colors">
                  {rfq.title}
                </h3>

                {/* Description snippet */}
                <p className="text-xs text-slate-500 line-clamp-2 flex-1">
                  {rfq.description.slice(0, 150)}{rfq.description.length > 150 ? '...' : ''}
                </p>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                  {rfq.quantity && (
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {rfq.quantity} {rfq.unit || ''}
                    </span>
                  )}
                  {rfq.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                    </span>
                  )}
                  {rfq.buyer.city && (
                    <span>{rfq.buyer.city}</span>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleQuoteClick(rfq.id)}
                  className="btn-primary w-full text-sm mt-auto"
                >
                  {user
                    ? (ar ? 'تقديم عرض سعر' : 'Submit Quote')
                    : (ar ? 'سجّل وقدّم عرضاً' : 'Register to Quote')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              {ar ? 'السابق' : 'Prev'}
            </button>
            <span className="px-4 py-2 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              {ar ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm text-slate-400">© 2026 Mwazn — موازن للمشتريات</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  MessageSquare, Search, ChevronRight, ArrowLeft, FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RFQWithQuotes {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  category?: { nameAr: string; nameEn: string };
  buyer?: { nameAr: string; nameEn: string; city?: string };
  _count?: { quotes: number };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminQuotesPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const base = `/${locale}/dashboard`;

  const [rfqs, setRfqs] = useState<RFQWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [error, setError] = useState(false);

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Fetch all RFQs with quote counts (quotes are accessible per-RFQ)
      const res = await api.get('/rfqs', { params: { limit: 100 } });
      const data = res.data?.data ?? res.data;
      const items: RFQWithQuotes[] = data?.items ?? data ?? [];
      // Sort by most quotes (descending), then by newest
      items.sort((a, b) => (b._count?.quotes ?? 0) - (a._count?.quotes ?? 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRfqs(items);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRfqs(); }, [fetchRfqs]);

  const filtered = search
    ? rfqs.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : rfqs;

  const totalQuotes = rfqs.reduce((sum, r) => sum + (r._count?.quotes ?? 0), 0);
  const activeRfqs = rfqs.filter((r) => (r._count?.quotes ?? 0) > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`${base}/admin`} className="text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">
                {ar ? 'عروض الأسعار' : 'Platform Quotes'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 ps-6">
              {ar
                ? `${totalQuotes} عرض عبر ${activeRfqs} طلب — اضغط على أي طلب لعرض عروضه`
                : `${totalQuotes} quotes across ${activeRfqs} RFQs — click any RFQ to view its quotes`}
            </p>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            {ar
              ? 'تُدار عروض الأسعار من خلال طلبات الأسعار. اضغط على أي طلب أدناه لعرض جميع العروض المقدّمة له.'
              : 'Quotes are managed through their parent RFQs. Click any RFQ below to view all submitted quotes.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ar ? 'بحث في طلبات الأسعار...' : 'Search RFQs...'}
            className="input-base ps-9 w-full"
          />
        </div>

        {/* RFQ list sorted by quote count */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : error ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'تعذّر تحميل البيانات' : 'Failed to load data'}</p>
            <button onClick={fetchRfqs} className="mt-3 text-xs text-brand-600 hover:underline">{ar ? 'إعادة المحاولة' : 'Retry'}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">{ar ? 'لا توجد نتائج' : 'No results found'}</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_160px_120px_100px_36px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              {[ar ? 'طلب العرض' : 'RFQ', ar ? 'المشتري' : 'Buyer', ar ? 'الفئة' : 'Category', ar ? 'عدد العروض' : 'Quotes', '']
                .map((h, i) => <p key={i} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>)}
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`${base}/admin/rfqs/${rfq.id}`}
                  className="flex md:grid md:grid-cols-[1fr_160px_120px_100px_36px] gap-4 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-700 transition-colors">
                      {rfq.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(rfq.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="hidden md:block text-xs text-slate-600 truncate">{ar ? rfq.buyer?.nameAr : rfq.buyer?.nameEn}</p>
                  <p className="hidden md:block text-xs text-slate-500 truncate">{ar ? rfq.category?.nameAr : rfq.category?.nameEn}</p>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span className={`text-sm font-bold ${(rfq._count?.quotes ?? 0) > 0 ? 'text-brand-700' : 'text-slate-400'}`}>
                      {rfq._count?.quotes ?? 0}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

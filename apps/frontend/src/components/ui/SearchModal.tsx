'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Search, Building2, Package, Tag, FileText,
  Loader2, X, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface SearchResult {
  companies: Array<{
    id: string; nameEn: string; nameAr: string; city: string;
    plan: string; slug: string | null; logoUrl: string | null;
    _count: { listings: number };
  }>;
  listings: Array<{
    id: string; titleEn: string; titleAr: string;
    price: string | null; currency: string;
    slug?: string | null;
    supplier: { id: string; nameEn: string; nameAr: string; slug: string | null };
    category: { nameEn: string; nameAr: string };
    images: Array<{ url: string }>;
  }>;
  categories: Array<{ id: string; nameEn: string; nameAr: string; slug: string }>;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data.data ?? data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 300);
    } else {
      setResults(null);
      setLoading(false);
    }
  }, [query, doSearch]);

  // Focus on open, clear on close
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      setQuery('');
      setResults(null);
      setLoading(false);
    }
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const hasResults = results && (
    results.companies.length > 0 ||
    results.listings.length > 0 ||
    results.categories.length > 0
  );

  const quickLinks = [
    {
      icon: <Building2 className="h-5 w-5" />,
      label: ar ? 'تصفح الموردين' : 'Browse Suppliers',
      desc: ar ? 'موردون موثقون في السعودية' : 'Verified Saudi suppliers',
      href: `/${locale}/suppliers`,
      color: 'bg-brand-50 text-brand-700',
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: ar ? 'تصفح المنتجات' : 'Browse Products',
      desc: ar ? 'منتجات وخدمات B2B' : 'B2B products & services',
      href: `/${locale}/products`,
      color: 'bg-violet-50 text-violet-700',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: ar ? 'طلبات الأسعار المفتوحة' : 'Open RFQs',
      desc: ar ? 'فرص مناقصات نشطة' : 'Active procurement bids',
      href: `/${locale}/rfqs`,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      icon: <Tag className="h-5 w-5" />,
      label: ar ? 'الفئات والقطاعات' : 'Categories & Sectors',
      desc: ar ? 'تصفح حسب الصناعة' : 'Browse by industry',
      href: `/${locale}/suppliers`,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[8vh] sm:pt-[10vh]">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">

          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            {loading
              ? <Loader2 className="h-5 w-5 text-brand-600 animate-spin shrink-0" />
              : <Search className="h-5 w-5 text-slate-400 shrink-0" />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.length >= 2) {
                  navigate(`/${locale}/search?q=${encodeURIComponent(query)}`);
                }
              }}
              placeholder={ar ? 'ابحث عن موردين، منتجات، طلبات أسعار...' : 'Search suppliers, products, RFQs...'}
              className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-base"
            />
            {query ? (
              <button
                onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                className="p-0.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400 font-mono">
                Esc
              </kbd>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[58vh] overflow-y-auto">

            {/* Empty state — quick navigation */}
            {!query && (
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-0.5">
                  {ar ? 'الوجهات السريعة' : 'Quick Navigation'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((ql) => (
                    <button
                      key={ql.href + ql.label}
                      onClick={() => navigate(ql.href)}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 hover:border-brand-200 hover:bg-brand-50/40 transition-all text-start group"
                    >
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5', ql.color)}>
                        {ql.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">
                          {ql.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{ql.desc}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-400 transition-colors mt-1 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {query.length >= 2 && !loading && !hasResults && (
              <div className="px-4 py-14 text-center">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  {ar ? 'لا توجد نتائج' : 'No results found'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {ar ? `لم نعثر على نتائج لـ "${query}"` : `Nothing matched "${query}"`}
                </p>
              </div>
            )}

            {/* Results */}
            {hasResults && (
              <div className="py-2">

                {/* Categories */}
                {results!.categories.length > 0 && (
                  <section>
                    <p className="px-4 pt-2 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {ar ? 'الفئات' : 'Categories'}
                    </p>
                    {results!.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => navigate(`/${locale}/suppliers?categorySlug=${cat.slug}`)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-start transition-colors group"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                          <Tag className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-slate-700 group-hover:text-brand-700 transition-colors">
                          {ar ? cat.nameAr : cat.nameEn}
                        </span>
                      </button>
                    ))}
                  </section>
                )}

                {/* Suppliers */}
                {results!.companies.length > 0 && (
                  <section className={cn(results!.categories.length > 0 && 'border-t border-slate-50 mt-1')}>
                    <p className="px-4 pt-3 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {ar ? 'الموردون' : 'Suppliers'}
                    </p>
                    {results!.companies.slice(0, 4).map((co) => (
                      <button
                        key={co.id}
                        onClick={() => navigate(`/${locale}/suppliers/${co.slug ?? co.id}`)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-start transition-colors"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0 overflow-hidden">
                          {co.logoUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={co.logoUrl} alt="" className="h-8 w-8 object-cover" />
                            : <Building2 className="h-4 w-4" />
                          }
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {ar ? co.nameAr : co.nameEn}
                          </p>
                          <p className="text-xs text-slate-400">
                            {co.city} · {co._count.listings} {ar ? 'منتج' : 'products'}
                          </p>
                        </div>
                        {co.plan === 'PRO' && (
                          <span className="shrink-0 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            PRO
                          </span>
                        )}
                      </button>
                    ))}
                  </section>
                )}

                {/* Products */}
                {results!.listings.length > 0 && (
                  <section className={cn(
                    (results!.categories.length > 0 || results!.companies.length > 0) && 'border-t border-slate-50 mt-1'
                  )}>
                    <p className="px-4 pt-3 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {ar ? 'المنتجات' : 'Products'}
                    </p>
                    {results!.listings.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/${locale}/products/${item.slug ?? item.id}`)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-start transition-colors"
                      >
                        {item.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.images[0].url}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover shrink-0 border border-slate-100"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
                            <Package className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {ar ? item.titleAr : item.titleEn}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {ar ? item.supplier.nameAr : item.supplier.nameEn} ·{' '}
                            {ar ? item.category.nameAr : item.category.nameEn}
                          </p>
                        </div>
                        {item.price && (
                          <span className="shrink-0 text-sm font-semibold text-brand-700">
                            {Number(item.price).toLocaleString()} {item.currency}
                          </span>
                        )}
                      </button>
                    ))}
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {query.length >= 2 && (
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/50">
              <button
                onClick={() => navigate(`/${locale}/search?q=${encodeURIComponent(query)}`)}
                className="text-sm text-brand-700 font-medium hover:text-brand-800 transition-colors flex items-center gap-1.5"
              >
                {ar ? `عرض كل نتائج "${query}"` : `View all results for "${query}"`}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-slate-400">
                {ar ? 'اضغط Enter للبحث' : 'Enter to search'}
              </span>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

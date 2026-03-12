'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Building2, Package, Search, Tag } from 'lucide-react';

type TabType = 'all' | 'suppliers' | 'products' | 'categories';

interface SearchResult {
  suppliers?: Array<{ id: string; slug?: string; nameAr: string; nameEn: string; city?: string; verificationStatus?: string; isFreelancer?: boolean }>;
  listings?: Array<{ id: string; slug?: string; titleAr: string; titleEn: string; price?: number; currency: string; supplier?: { nameAr: string; nameEn: string } }>;
  categories?: Array<{ id: string; slug: string; nameAr: string; nameEn: string; _count?: { listings: number } }>;
}

const TABS: { key: TabType; en: string; ar: string }[] = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'suppliers', en: 'Suppliers', ar: 'الموردون' },
  { key: 'products', en: 'Products', ar: 'المنتجات' },
  { key: 'categories', en: 'Categories', ar: 'الفئات' },
];

export default function SearchPage() {
  const locale = useLocale();
  const ar = locale === 'ar';
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [tab, setTab] = useState<TabType>('all');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string, type: TabType) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q: q.trim(), type: type === 'all' ? undefined : type } });
      setResults(res.data.data ?? res.data);
    } catch { setResults(null); }
    setLoading(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, tab), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tab]);

  const hasResults = results && (
    (results.suppliers?.length ?? 0) +
    (results.listings?.length ?? 0) +
    (results.categories?.length ?? 0)
  ) > 0;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? 'ابحث عن موردين، منتجات، فئات...' : 'Search suppliers, products, categories...'}
            className="input-base pl-12 py-3.5 text-base w-full rtl:pl-4 rtl:pr-12"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && query && !hasResults && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="font-medium text-slate-600">{ar ? 'لا توجد نتائج' : 'No results found'}</p>
            <p className="text-sm text-slate-400 mt-1">{ar ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`}</p>
          </div>
        )}

        {/* No query */}
        {!loading && !query && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{ar ? 'ابدأ بالكتابة للبحث' : 'Start typing to search'}</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="space-y-8">
            {/* Suppliers */}
            {(tab === 'all' || tab === 'suppliers') && results?.suppliers && results.suppliers.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {ar ? `الموردون (${results.suppliers.length})` : `Suppliers (${results.suppliers.length})`}
                </h2>
                <div className="space-y-2">
                  {results.suppliers.map((s) => (
                    <Link
                      key={s.id}
                      href={`/${locale}/suppliers/${s.slug ?? s.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-bold text-brand-700">
                        {(s.nameEn || 'S').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{ar ? s.nameAr : s.nameEn}</p>
                        {s.city && <p className="text-xs text-slate-400">{s.city}</p>}
                      </div>
                      {s.isFreelancer
                        ? <span className="text-xs text-blue-700 font-medium shrink-0">{ar ? 'بائع مستقل' : 'Independent Seller'}</span>
                        : s.verificationStatus === 'VERIFIED'
                          ? <span className="text-xs text-emerald-700 font-medium shrink-0">{ar ? 'سجل تجاري موثّق' : 'CR Verified'}</span>
                          : null
                      }
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            {(tab === 'all' || tab === 'products') && results?.listings && results.listings.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Package className="h-4 w-4 text-slate-400" />
                  {ar ? `المنتجات (${results.listings.length})` : `Products (${results.listings.length})`}
                </h2>
                <div className="space-y-2">
                  {results.listings.map((l) => (
                    <Link
                      key={l.id}
                      href={`/${locale}/products/${l.slug || l.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Package className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{ar ? l.titleAr : l.titleEn}</p>
                        {l.supplier && (
                          <p className="text-xs text-slate-400">{ar ? l.supplier.nameAr : l.supplier.nameEn}</p>
                        )}
                      </div>
                      {l.price && (
                        <p className="text-sm font-bold text-brand-700 shrink-0">
                          {l.price.toLocaleString()} {l.currency}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            {(tab === 'all' || tab === 'categories') && results?.categories && results.categories.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Tag className="h-4 w-4 text-slate-400" />
                  {ar ? `الفئات (${results.categories.length})` : `Categories (${results.categories.length})`}
                </h2>
                <div className="space-y-2">
                  {results.categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/${locale}/products?category=${c.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 hover:border-brand-200 hover:bg-brand-50/30 transition-all"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                        <Tag className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">{ar ? c.nameAr : c.nameEn}</p>
                      </div>
                      {c._count?.listings !== undefined && (
                        <p className="text-xs text-slate-400 shrink-0">{c._count.listings} {ar ? 'منتج' : 'products'}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Search, Building2, Package, Tag, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface SearchResult {
  companies: Array<{
    id: string; nameEn: string; nameAr: string; city: string;
    plan: string; slug: string | null; logoUrl: string | null;
    _count: { listings: number };
  }>;
  listings: Array<{
    id: string; titleEn: string; titleAr: string; price: string | null;
    currency: string; unit: string | null;
    supplier: { id: string; nameEn: string; nameAr: string; slug: string | null };
    category: { nameEn: string; nameAr: string };
    images: Array<{ url: string }>;
  }>;
  categories: Array<{ id: string; nameEn: string; nameAr: string; slug: string }>;
}

interface SearchBarProps {
  className?: string;
  size?: 'md' | 'lg';
  placeholder?: string;
}

export function SearchBar({ className, size = 'md', placeholder }: SearchBarProps) {
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      const r: SearchResult = data.data ?? data;
      setResults(r);
      setOpen(true);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 300);
    } else {
      setResults(null);
      setOpen(false);
    }
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults =
    results &&
    (results.companies.length > 0 || results.listings.length > 0 || results.categories.length > 0);

  const isLg = size === 'lg';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && query.length >= 2) {
      setOpen(false);
      router.push(`/${locale}/suppliers?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-white shadow-card transition-all duration-200',
          open ? 'border-brand-400 ring-2 ring-brand-600/10' : 'border-slate-200',
          isLg ? 'px-5 py-3.5' : 'px-4 py-2.5',
        )}
      >
        {loading ? (
          <Loader2 className={cn('text-brand-600 animate-spin shrink-0', isLg ? 'h-5 w-5' : 'h-4 w-4')} />
        ) : (
          <Search className={cn('text-slate-400 shrink-0', isLg ? 'h-5 w-5' : 'h-4 w-4')} />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            (locale === 'ar'
              ? 'ابحث عن موردين، منتجات، فئات...'
              : 'Search vendors, products, categories...')
          }
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-slate-400',
            'text-slate-800',
            isLg ? 'text-base' : 'text-sm',
          )}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false); inputRef.current?.focus(); }}>
            <X className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-lift border border-slate-100 overflow-hidden animate-slide-up">
          {results!.categories.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {locale === 'ar' ? 'الفئات' : 'Categories'}
              </p>
              {results!.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    router.push(`/${locale}/suppliers?categorySlug=${cat.slug}`);
                    setOpen(false); setQuery('');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-left transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Tag className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm text-slate-700">
                    {locale === 'ar' ? cat.nameAr : cat.nameEn}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results!.companies.length > 0 && (
            <div className="border-t border-slate-50">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {locale === 'ar' ? 'الموردون' : 'Vendors'}
              </p>
              {results!.companies.map((co) => (
                <button
                  key={co.id}
                  onClick={() => {
                    router.push(`/${locale}/suppliers/${co.slug ?? co.id}`);
                    setOpen(false); setQuery('');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-left transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
                    {co.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={co.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {locale === 'ar' ? co.nameAr : co.nameEn}
                    </p>
                    <p className="text-xs text-slate-400">{co.city} · {co._count.listings} products</p>
                  </div>
                  {co.plan === 'PRO' && (
                    <span className="ms-auto shrink-0 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results!.listings.length > 0 && (
            <div className="border-t border-slate-50">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {locale === 'ar' ? 'المنتجات' : 'Products'}
              </p>
              {results!.listings.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(`/${locale}/suppliers/${item.supplier.slug ?? item.supplier.id}`);
                    setOpen(false); setQuery('');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-50 text-left transition-colors"
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
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {locale === 'ar' ? item.titleAr : item.titleEn}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {locale === 'ar' ? item.supplier.nameAr : item.supplier.nameEn} ·{' '}
                      {locale === 'ar' ? item.category.nameAr : item.category.nameEn}
                    </p>
                  </div>
                  {item.price && (
                    <span className="ms-auto shrink-0 text-sm font-semibold text-brand-700">
                      {Number(item.price).toLocaleString()} {item.currency}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 px-4 py-3">
            <button
              onClick={() => {
                router.push(`/${locale}/suppliers?search=${encodeURIComponent(query)}`);
                setOpen(false);
              }}
              className="text-sm text-brand-700 font-medium hover:underline"
            >
              {locale === 'ar' ? `عرض كل نتائج "${query}"` : `See all results for "${query}"`}
            </button>
          </div>
        </div>
      )}

      {open && query.length >= 2 && !loading && !hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-lift border border-slate-100 px-4 py-8 text-center animate-slide-up">
          <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">
            {locale === 'ar' ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import api from '@/lib/api';
import type { Listing, Category, PaginatedResponse } from '@/types';
import { Package, Search, SlidersHorizontal, Star, Clock, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: { en: 'Latest', ar: 'الأحدث' } },
  { value: 'price_asc', label: { en: 'Price: Low to High', ar: 'السعر: الأقل أولاً' } },
  { value: 'price_desc', label: { en: 'Price: High to Low', ar: 'السعر: الأعلى أولاً' } },
  { value: 'popular', label: { en: 'Most Popular', ar: 'الأكثر شعبية' } },
];

export default function ProductsPage() {
  const locale = useLocale();
  const ar = locale === 'ar';

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const LIMIT = 24;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      if (sort) params.sort = sort;

      const res = await api.get('/listings', { params });
      const data: PaginatedResponse<Listing> = res.data.data;
      setListings(data.items || []);
      setTotal(data.meta?.total || 0);
    } catch { /* silent */ }
    setLoading(false);
  }, [page, search, categoryId, minPrice, maxPrice, sort]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data?.items || res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilter = (field: string, value: string) => {
    if (field === 'category') { setCategoryId(value); }
    if (field === 'minPrice') { setMinPrice(value); }
    if (field === 'maxPrice') { setMaxPrice(value); }
    if (field === 'sort') { setSort(value); }
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-14 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {ar ? 'تسوق المنتجات الصناعية' : 'Browse Industrial Products'}
            </h1>
            <p className="text-white/60">
              {ar
                ? 'آلاف المنتجات من موردين موثقين بالسجل التجاري'
                : 'Thousands of products from CR-verified Saudi suppliers'}
            </p>
          </div>
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={ar ? 'ابحث عن منتج أو مورد...' : 'Search products, suppliers...'}
              className="w-full rounded-2xl border-0 bg-white/95 ps-12 pe-32 py-4 text-sm shadow-lift focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-all"
            >
              {ar ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Category filter */}
          <select
            value={categoryId}
            onChange={(e) => handleFilter('category', e.target.value)}
            className="input-base bg-white py-2 text-sm w-auto min-w-40"
          >
            <option value="">{ar ? 'كل الفئات' : 'All Categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{ar ? cat.nameAr : cat.nameEn}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => handleFilter('sort', e.target.value)}
            className="input-base bg-white py-2 text-sm w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{ar ? opt.label.ar : opt.label.en}</option>
            ))}
          </select>

          {/* Price filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {ar ? 'السعر' : 'Price'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={ar ? 'من' : 'Min'}
                value={minPrice}
                onChange={(e) => handleFilter('minPrice', e.target.value)}
                className="input-base bg-white py-2 text-sm w-24"
                min="0"
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="number"
                placeholder={ar ? 'إلى' : 'Max'}
                value={maxPrice}
                onChange={(e) => handleFilter('maxPrice', e.target.value)}
                className="input-base bg-white py-2 text-sm w-24"
                min="0"
              />
              <span className="text-xs text-slate-400">SAR</span>
            </div>
          )}

          {/* Results count */}
          <p className="ms-auto text-sm text-slate-500">
            {ar ? `${total.toLocaleString()} منتج` : `${total.toLocaleString()} products`}
          </p>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white animate-pulse">
                <div className="aspect-square rounded-t-2xl bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              {ar ? 'لا توجد منتجات تطابق البحث' : 'No products match your search'}
            </p>
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setCategoryId(''); setMinPrice(''); setMaxPrice(''); setSort(''); setPage(1); }}
              className="mt-3 text-sm text-brand-700 hover:underline"
            >
              {ar ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {listings.map((listing) => {
              const title = ar ? listing.titleAr : listing.titleEn;
              const href = `/${locale}/products/${listing.slug || listing.id}`;
              const img = listing.images?.[0]?.url;
              return (
                <Link key={listing.id} href={href} className="group rounded-2xl bg-white border border-slate-100 hover:shadow-card hover:border-brand-100 transition-all overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="aspect-square bg-slate-50 overflow-hidden">
                    {img ? (
                      <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-3 flex flex-col gap-1">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug">{title}</p>

                    {listing.supplier && (
                      <p className="text-[10px] text-slate-400 truncate">
                        {ar ? listing.supplier.nameAr : listing.supplier.nameEn}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-auto pt-1">
                      {listing.price ? (
                        <p className="text-xs font-bold text-brand-700">
                          {listing.price.toLocaleString()}
                          {listing.priceTo && `–${(listing.priceTo as number).toLocaleString()}`} {listing.currency}
                          {listing.unit && <span className="text-[10px] font-normal text-slate-400">/{listing.unit}</span>}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400">{ar ? 'عند الطلب' : 'On request'}</p>
                      )}
                    </div>

                    {/* Lead time + certifications */}
                    <div className="flex items-center gap-2">
                      {listing.leadTimeDays && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          {listing.leadTimeDays}d
                        </span>
                      )}
                      {listing.certifications && listing.certifications.length > 0 && (
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
                          {listing.certifications[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {ar ? '← السابق' : '← Prev'}
            </button>
            <span className="text-sm text-slate-500">
              {ar ? `${page} / ${totalPages}` : `${page} / ${totalPages}`}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {ar ? 'التالي →' : 'Next →'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white mt-10">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-700">
              <span className="text-xs font-bold text-white">م</span>
            </div>
            <span className="font-semibold text-brand-700">{ar ? 'موازن' : 'Mwazn'}</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 Mwazn. {ar ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

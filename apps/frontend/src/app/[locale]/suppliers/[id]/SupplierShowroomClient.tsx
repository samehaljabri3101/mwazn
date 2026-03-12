'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  MapPin, Globe, Phone, Star, Package, MessageSquare,
  CheckCircle2, Building2, Tag, Clock, Award, Search, Share2,
} from 'lucide-react';
import { resolveListingImage } from '@/lib/categoryImages';

interface ShowroomListing {
  id: string;
  slug?: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price?: number;
  priceTo?: number;
  currency: string;
  unit?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  tags?: string[];
  certifications?: string[];
  viewCount?: number;
  images: Array<{ url: string; isPrimary: boolean }>;
  category?: { id: string; nameAr: string; nameEn: string; slug?: string };
  _count?: { quotes: number };
}

interface ShowroomData {
  company: {
    id: string;
    nameAr: string;
    nameEn: string;
    crNumber?: string | null;
    slug?: string;
    city?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    plan: string;
    verificationStatus: string;
    isFreelancer?: boolean;
    createdAt: string;
  };
  listings: ShowroomListing[];
  averageRating: number;
  totalRatings: number;
}

export function SupplierShowroomClient() {
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const ar = locale === 'ar';
  const { user } = useAuth();

  const [data, setData] = useState<ShowroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [contacting, setContacting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleWhatsApp = () => {
    if (!data) return;
    const name = ar ? data.company.nameAr : data.company.nameEn;
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${name} — ${url}`)}`);
  };

  useEffect(() => {
    api.get(`/companies/${id}/showroom`).then((res) => {
      setData(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleContact = async () => {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (!data?.company.id) return;
    setContacting(true);
    try {
      const res = await api.post('/conversations/start', {
        targetCompanyId: data.company.id,
      });
      router.push(`/${locale}/dashboard/messages/${res.data.data?.id}`);
    } catch { /* silent */ }
    setContacting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 pt-24 space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 text-center px-4">
          <Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{ar ? 'لم يتم العثور على المورد' : 'Supplier not found'}</p>
          <Link href={`/${locale}/suppliers`} className="mt-4 inline-block text-brand-700 hover:underline text-sm">
            {ar ? '← العودة للموردين' : '← Back to Suppliers'}
          </Link>
        </div>
      </div>
    );
  }

  const { company, listings, averageRating, totalRatings } = data;
  const companyName = ar ? company.nameAr : company.nameEn;
  const description = ar ? company.descriptionAr : company.descriptionEn;
  const memberSince = new Date(company.createdAt).getFullYear();

  // Get unique categories from listings
  const categories = Array.from(
    new Map(
      listings
        .filter((l) => l.category)
        .map((l) => [l.category!.id, l.category!])
    ).values()
  );

  // Filter listings
  const filtered = listings.filter((l) => {
    const titleMatch = search === '' ||
      l.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      l.titleAr.includes(search);
    const catMatch = selectedCategory === '' || l.category?.id === selectedCategory;
    return titleMatch && catMatch;
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 pt-20 pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center gap-6">
          {/* Logo */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-brand-700 font-bold text-4xl shadow-lift border-4 border-white/10">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={companyName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              companyName.charAt(0)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{companyName}</h1>
              {company.plan === 'PRO' && (
                <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-900">PRO</span>
              )}
              {company.isFreelancer ? (
                <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {ar ? 'بائع مستقل' : 'Independent Seller'}
                </span>
              ) : company.verificationStatus === 'VERIFIED' ? (
                <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {ar ? 'سجل تجاري موثّق' : 'CR Verified'}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/60 justify-center sm:justify-start">
              {company.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.city}
                </span>
              )}
              {totalRatings > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  {averageRating.toFixed(1)}
                  <span className="text-white/40">({totalRatings})</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {ar ? `${listings.length} منتج` : `${listings.length} products`}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {ar ? `س.ت: ${company.crNumber}` : `CR: ${company.crNumber}`}
              </span>
              <span className="text-white/40 text-xs">
                {ar ? `عضو منذ ${memberSince}` : `Since ${memberSince}`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleContact}
              disabled={contacting}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-all shadow-md disabled:opacity-60"
            >
              <MessageSquare className="h-4 w-4" />
              {contacting ? (ar ? 'جاري...' : 'Opening...') : (ar ? 'راسل المورد' : 'Message Supplier')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                <Share2 className="h-4 w-4" />
                {copied ? (ar ? 'تم النسخ!' : 'Copied!') : (ar ? 'مشاركة' : 'Share')}
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-1 rounded-xl bg-green-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-all"
                title="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.07-1.35A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18a8 8 0 0 1-4.09-1.12l-.29-.17-3.01.8.82-2.96-.19-.31A8 8 0 1 1 12 20z"/></svg>
              </button>
            </div>
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all">
                <Phone className="h-4 w-4" />
                {company.phone}
              </a>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all">
                <Globe className="h-4 w-4" />
                {ar ? 'الموقع الإلكتروني' : 'Website'}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Post RFQ CTA */}
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <h3 className="font-semibold text-brand-800 text-sm mb-1">
                {ar ? 'هل تريد الشراء من هذا المورد؟' : 'Want to source from this supplier?'}
              </h3>
              <p className="text-xs text-brand-600 mb-3 leading-relaxed">
                {ar
                  ? 'أنشر طلب عرض سعر وسيرد عليك المورد بعرض مخصص.'
                  : 'Post an RFQ and get a tailored quote directly from them.'}
              </p>
              <Link
                href={user ? `/${locale}/dashboard/buyer/rfqs/new` : `/${locale}/auth/login?redirect=rfq`}
                className="block w-full rounded-xl bg-brand-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                {ar ? 'انشر طلب عرض' : 'Post an RFQ'}
              </Link>
            </div>

            {/* About */}
            {description && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">{ar ? 'عن الشركة' : 'About'}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Rating summary */}
            {totalRatings > 0 && (
              <div className="card text-center">
                <p className="text-3xl font-bold text-slate-800">{averageRating.toFixed(1)}</p>
                <div className="flex justify-center gap-0.5 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">{ar ? `${totalRatings} تقييم` : `${totalRatings} ratings`}</p>
              </div>
            )}

            {/* Specializations */}
            {categories.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm">{ar ? 'التخصصات' : 'Specializations'}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {ar ? cat.nameAr : cat.nameEn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Category filter */}
            {categories.length > 1 && (
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm">{ar ? 'الفئات' : 'Categories'}</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-start rounded-lg px-3 py-2 text-xs transition-all ${
                      selectedCategory === '' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ar ? 'الكل' : 'All'} ({listings.length})
                  </button>
                  {categories.map((cat) => {
                    const count = listings.filter((l) => l.category?.id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-start rounded-lg px-3 py-2 text-xs transition-all ${
                          selectedCategory === cat.id ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {ar ? cat.nameAr : cat.nameEn} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Products grid */}
          <div className="lg:col-span-3">
            {/* Search + header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h2 className="font-semibold text-slate-800 flex-1">
                {ar ? `المنتجات (${filtered.length})` : `Products (${filtered.length})`}
              </h2>
              {listings.length > 4 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 rtl:left-auto rtl:right-3" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={ar ? 'ابحث في المنتجات...' : 'Search products...'}
                    className="input-base pl-9 py-2 text-sm w-full sm:w-56 rtl:pl-3 rtl:pr-9"
                  />
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="card text-center py-12">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">
                  {search ? (ar ? 'لا توجد نتائج مطابقة' : 'No matching products found') : (ar ? 'لا توجد منتجات مدرجة بعد' : 'No products listed yet')}
                </p>
                {!search && (
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                    {ar
                      ? 'يمكنك التواصل مع المورد مباشرة أو نشر طلب عرض سعر.'
                      : 'You can message the supplier directly or post an RFQ to get a quote.'}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/${locale}/products/${listing.slug || listing.id}`}
                    className="card card-hover flex flex-col gap-3 group"
                  >
                    {/* Image */}
                    <div className="aspect-video w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={resolveListingImage(listing.images?.[0]?.url, listing.category?.slug, 0, listing.id)}
                        alt={ar ? listing.titleAr : listing.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      {/* Category */}
                      {listing.category && (
                        <p className="text-xs text-slate-400">
                          {ar ? listing.category.nameAr : listing.category.nameEn}
                        </p>
                      )}

                      {/* Title */}
                      <p className="font-semibold text-slate-800 text-sm line-clamp-2">
                        {ar ? listing.titleAr : listing.titleEn}
                      </p>

                      {/* Tags */}
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {listing.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                              {tag}
                            </span>
                          ))}
                          {listing.tags.length > 2 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                              +{listing.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Certifications */}
                      {listing.certifications && listing.certifications.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-green-500" />
                          <span className="text-[10px] text-green-600">
                            {listing.certifications.slice(0, 2).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-1.5 flex items-end justify-between">
                        {/* Price */}
                        <div>
                          {listing.price ? (
                            <p className="text-sm font-bold text-brand-700">
                              {listing.price.toLocaleString()}{listing.priceTo ? `–${listing.priceTo.toLocaleString()}` : ''} {listing.currency}
                              {listing.unit && <span className="text-[10px] text-slate-400 font-normal"> / {listing.unit}</span>}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400">{ar ? 'السعر عند الطلب' : 'Price on request'}</p>
                          )}
                          {listing.minOrderQty && (
                            <p className="text-[10px] text-slate-400">
                              {ar ? `أدنى: ${listing.minOrderQty}` : `MOQ: ${listing.minOrderQty}`} {listing.unit || ''}
                            </p>
                          )}
                        </div>

                        {/* Lead time + quote count */}
                        <div className="text-right">
                          {listing.leadTimeDays && (
                            <p className="flex items-center gap-1 text-[10px] text-slate-400 justify-end">
                              <Clock className="h-3 w-3" />
                              {listing.leadTimeDays}d
                            </p>
                          )}
                          {listing._count?.quotes !== undefined && (
                            <p className="text-[10px] text-slate-400">
                              {listing._count.quotes} {ar ? 'عرض' : 'quotes'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <Link href={`/${locale}/suppliers`} className="text-sm text-slate-400 hover:text-brand-700">
            {ar ? '← العودة للموردين' : '← Back to Suppliers'}
          </Link>
          <p className="text-sm text-slate-400">© 2026 Mwazn</p>
        </div>
      </footer>
    </div>
  );
}

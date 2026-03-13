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
import type { Listing } from '@/types';
import {
  Package, MapPin, Star, CheckCircle2, ChevronLeft, ChevronRight,
  Tag, Award, Clock, ShoppingCart, MessageSquare, FileText,
  Eye, ExternalLink, Building2,
} from 'lucide-react';
import { resolveListingImage } from '@/lib/categoryImages';
import { TrustBadge } from '@/components/ui/TrustBadge';

export function ProductDetailClient() {
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const ar = locale === 'ar';
  const { user, company } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [inquiring, setInquiring] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${id}`),
      api.get(`/listings/${id}/similar`, { params: { limit: 4 } }),
    ])
      .then(([listingRes, similarRes]) => {
        setListing(listingRes.data.data);
        setSimilar(similarRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleInquire = async () => {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (!listing?.supplier?.id) return;
    setInquiring(true);
    try {
      const res = await api.post('/conversations/start', {
        targetCompanyId: listing.supplier.id,
        subject: ar ? `استفسار عن: ${listing.titleAr}` : `Inquiry about: ${listing.titleEn}`,
      });
      const convId = res.data.data?.id;
      router.push(`/${locale}/dashboard/messages/${convId}`);
    } catch { /* silent */ }
    setInquiring(false);
  };

  const handleRequestQuote = () => {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    router.push(`/${locale}/dashboard/buyer/rfqs/new?title=${encodeURIComponent(ar ? listing?.titleAr || '' : listing?.titleEn || '')}&categoryId=${listing?.categoryId || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 text-center px-4">
          <Package className="h-16 w-16 text-slate-300 mb-4" />
          <p className="text-slate-500">{ar ? 'المنتج غير موجود' : 'Product not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-brand-700 hover:underline text-sm">
            {ar ? '← رجوع' : '← Go back'}
          </button>
        </div>
      </div>
    );
  }

  const title = ar ? listing.titleAr : listing.titleEn;
  const description = ar ? listing.descriptionAr : listing.descriptionEn;
  const supplierName = listing.supplier ? (ar ? listing.supplier.nameAr : listing.supplier.nameEn) : '';
  const catSlug = listing.category?.slug;
  const rawImages = listing.images || [];
  // Resolve category-accurate images (always uses curated category pool for demo quality)
  const images = rawImages.length > 0
    ? rawImages.map((img, i) => ({ ...img, url: resolveListingImage(img.url, catSlug, i, listing.id) }))
    : [{ id: 'fallback', url: resolveListingImage(null, catSlug, 0, listing.id), isPrimary: true, sortOrder: 0 }];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 pt-16">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
          <Link href={`/${locale}`} className="hover:text-brand-700">{ar ? 'الرئيسية' : 'Home'}</Link>
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
          <Link href={`/${locale}/listings`} className="hover:text-brand-700">{ar ? 'المنتجات' : 'Products'}</Link>
          {listing.category && (
            <>
              <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              <span>{ar ? listing.category.nameAr : listing.category.nameEn}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
          <span className="text-slate-600 font-medium line-clamp-1">{title}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
              <img
                src={images[activeImg]?.url}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((p) => Math.max(0, p - 1))}
                    disabled={activeImg === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md disabled:opacity-30 hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveImg((p) => Math.min(images.length - 1, p + 1))}
                    disabled={activeImg === images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md disabled:opacity-30 hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {/* View count */}
              {listing.viewCount !== undefined && (
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                  <Eye className="h-3 w-3" />
                  {listing.viewCount}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImg ? 'border-brand-700' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={img.url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Category + Status */}
            <div className="flex flex-wrap items-center gap-2">
              {listing.category && (
                <Badge variant="blue">
                  {ar ? listing.category.nameAr : listing.category.nameEn}
                </Badge>
              )}
              {listing.status === 'ACTIVE' && <Badge variant="green">{ar ? 'متاح' : 'Available'}</Badge>}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">{title}</h1>

            {/* Price */}
            {(listing.price || listing.priceTo) && (
              <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4">
                <p className="text-xs text-brand-600 font-medium mb-1">{ar ? 'السعر' : 'Price'}</p>
                <p className="text-2xl font-bold text-brand-700">
                  {listing.price?.toLocaleString()} {listing.currency}
                  {listing.priceTo && (
                    <span className="text-lg font-normal text-brand-500">
                      {' – '}{listing.priceTo.toLocaleString()} {listing.currency}
                    </span>
                  )}
                  {listing.unit && (
                    <span className="text-sm font-normal text-brand-500"> / {listing.unit}</span>
                  )}
                </p>
              </div>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3">
              {listing.minOrderQty && (
                <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">{ar ? 'أدنى كمية' : 'Min. Order'}</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {listing.minOrderQty.toLocaleString()} {listing.unit || (ar ? 'وحدة' : 'units')}
                  </p>
                </div>
              )}
              {listing.leadTimeDays && (
                <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ar ? 'مدة التسليم' : 'Lead Time'}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {listing.leadTimeDays} {ar ? 'يوم' : 'days'}
                  </p>
                </div>
              )}
              {listing._count?.quotes !== undefined && (
                <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">{ar ? 'عروض الأسعار' : 'Quotes'}</p>
                  <p className="text-sm font-semibold text-slate-700">{listing._count.quotes}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {ar ? 'الكلمات الدلالية' : 'Tags'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {listing.certifications && listing.certifications.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {ar ? 'الشهادات والمعايير' : 'Certifications'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.certifications.map((cert) => (
                    <span key={cert} className="rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleInquire}
                disabled={inquiring}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                {inquiring
                  ? (ar ? 'جاري التواصل...' : 'Opening chat...')
                  : (ar ? 'تواصل مع المورد' : 'Contact Supplier')}
              </button>
              <button
                onClick={handleRequestQuote}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-all"
              >
                <FileText className="h-4 w-4" />
                {ar ? 'طلب عرض سعر' : 'Request Quote (RFQ)'}
              </button>
            </div>
          </div>
        </div>

        {/* Description + Supplier card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Description */}
          <div className="lg:col-span-2 card">
            <h2 className="font-semibold text-slate-800 mb-3">{ar ? 'وصف المنتج' : 'Product Description'}</h2>
            {description ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">{ar ? 'لا يوجد وصف' : 'No description provided'}</p>
            )}
          </div>

          {/* Supplier card */}
          {listing.supplier && (
            <div className="card flex flex-col gap-4">
              <h3 className="font-semibold text-slate-700 text-sm">{ar ? 'المورد' : 'Supplier'}</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold text-xl border border-brand-100">
                  {supplierName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{supplierName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {listing.supplier.verificationStatus === 'VERIFIED' && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {ar ? 'موثق' : 'CR Verified'}
                      </span>
                    )}
                    {listing.supplier.plan === 'PRO' && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">PRO</span>
                    )}
                    {listing.supplier.verificationStatus === 'VERIFIED' && listing.supplier.plan === 'PRO' && (
                      <TrustBadge tier="TOP_SUPPLIER" size="sm" ar={ar} />
                    )}
                  </div>
                </div>
              </div>

              {listing.supplier.city && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.supplier.city}
                </p>
              )}
              {listing.supplier._count && (
                <p className="text-xs text-slate-500">
                  {ar
                    ? `${listing.supplier._count.listings} منتج · ${listing.supplier._count.ratingsReceived} تقييم`
                    : `${listing.supplier._count.listings} products · ${listing.supplier._count.ratingsReceived} ratings`}
                </p>
              )}

              <Link
                href={`/${locale}/suppliers/${listing.supplier.slug || listing.supplier.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Building2 className="h-3.5 w-3.5" />
                {ar ? 'عرض صفحة المورد' : 'View Showroom'}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">{ar ? 'منتجات مشابهة' : 'Similar Products'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  href={`/${locale}/products/${item.slug || item.id}`}
                  className="card card-hover flex flex-col gap-2 group"
                >
                  <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden">
                    <img
                      src={resolveListingImage(item.images?.[0]?.url, (item as any).category?.slug, 0, item.id)}
                      alt={ar ? item.titleAr : item.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 line-clamp-2">
                      {ar ? item.titleAr : item.titleEn}
                    </p>
                    {item.price && (
                      <p className="text-xs font-bold text-brand-700 mt-1">
                        {item.price.toLocaleString()} {item.currency}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white mt-8">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-brand-700">
            {ar ? '← رجوع' : '← Go back'}
          </button>
          <p className="text-sm text-slate-400">© 2026 Mwazn</p>
        </div>
      </footer>
    </div>
  );
}

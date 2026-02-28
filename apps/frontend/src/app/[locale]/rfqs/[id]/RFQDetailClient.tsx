'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FileText, Clock, Tag, Package, DollarSign, MapPin, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface RFQDetail {
  id: string;
  title: string;
  description: string;
  quantity?: number;
  unit?: string;
  budget?: number;
  currency: string;
  deadline?: string;
  status: string;
  createdAt: string;
  category: { nameAr: string; nameEn: string };
  buyer: { nameAr: string; nameEn: string; city?: string };
  images: Array<{ id: string; url: string; sortOrder: number }>;
  _count: { quotes: number };
}

export default function RFQDetailClient({ id }: { id: string }) {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === 'ar';
  const { user } = useAuth();

  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    api.get(`/rfqs/${id}`)
      .then((res) => setRfq(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 pt-24 space-y-4">
          <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-8 bg-slate-100 animate-pulse rounded w-3/4" />
          <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 text-center px-4">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{ar ? 'الطلب غير موجود' : 'RFQ not found'}</p>
          <Link href={`/${locale}/rfqs`} className="mt-4 text-brand-700 hover:underline text-sm">
            {ar ? '← العودة' : '← Back to RFQs'}
          </Link>
        </div>
      </div>
    );
  }

  const handleQuote = () => {
    if (!user) {
      router.push(`/${locale}/auth/register?type=SUPPLIER`);
    } else if (user.role === 'SUPPLIER_ADMIN') {
      router.push(`/${locale}/dashboard/supplier/rfqs`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link href={`/${locale}/rfqs`} className="hover:text-brand-700">{ar ? 'الطلبات' : 'RFQs'}</Link>
          <span>/</span>
          <span className="text-slate-700 truncate max-w-xs">{rfq.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            {rfq.images.length > 0 && (
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden">
                  <img
                    src={rfq.images[activeImage]?.url}
                    alt={rfq.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {rfq.images.length > 1 && (
                  <div className="flex gap-2">
                    {rfq.images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(i)}
                        className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImage === i ? 'border-brand-700' : 'border-transparent'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                  {ar ? rfq.category.nameAr : rfq.category.nameEn}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  rfq.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {rfq.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{rfq.title}</h1>
              <p className="text-sm text-slate-400 mt-1">
                {ar ? rfq.buyer.nameAr : rfq.buyer.nameEn}
                {rfq.buyer.city && ` • ${rfq.buyer.city}`}
              </p>
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-3">{ar ? 'تفاصيل الطلب' : 'Request Details'}</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{rfq.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick info */}
            <div className="card space-y-4">
              {rfq.quantity && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{ar ? 'الكمية' : 'Quantity'}</p>
                    <p className="text-sm font-semibold text-slate-800">{rfq.quantity} {rfq.unit || ''}</p>
                  </div>
                </div>
              )}

              {rfq.budget && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{ar ? 'الميزانية' : 'Budget'}</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {ar ? 'حتى' : 'Up to'} {Number(rfq.budget).toLocaleString()} {rfq.currency}
                    </p>
                  </div>
                </div>
              )}

              {rfq.deadline && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{ar ? 'الموعد النهائي' : 'Deadline'}</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {format(new Date(rfq.deadline), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{ar ? 'العروض المقدمة' : 'Quotes Received'}</p>
                  <p className="text-sm font-semibold text-slate-800">{rfq._count.quotes}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            {rfq.status === 'OPEN' && (
              <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
                <h3 className="font-semibold text-slate-800 mb-2">
                  {ar ? 'هل أنت مورد؟' : 'Are you a supplier?'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {user
                    ? (ar ? 'انتقل للوحة التحكم لتقديم عرضك' : 'Go to your dashboard to submit a quote')
                    : (ar ? 'سجّل كمورد وقدّم عرضك التنافسي' : 'Register as a supplier to submit your quote')}
                </p>
                <button
                  onClick={handleQuote}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {user
                    ? (ar ? 'الذهاب للوحة التحكم' : 'Go to Dashboard')
                    : (ar ? 'التسجيل كمورد' : 'Register as Supplier')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            )}

            <Link
              href={`/${locale}/rfqs`}
              className="block text-center text-sm text-brand-700 hover:underline"
            >
              {ar ? '← العودة لجميع الطلبات' : '← Back to all RFQs'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

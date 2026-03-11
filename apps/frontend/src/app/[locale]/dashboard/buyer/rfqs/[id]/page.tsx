'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ImageUploader } from '@/components/ui/ImageUploader';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { RFQ, Quote, RfqImage } from '@/types';
import {
  ChevronLeft, Calendar, Tag, DollarSign, Package,
  CheckCircle2, XCircle, Clock, Star, MessageSquare,
  AlertTriangle, ImageIcon, UserPlus, ChevronDown, ChevronUp,
  ShieldCheck, Truck, CreditCard, Wrench,
} from 'lucide-react';
import { InviteSupplierModal } from '@/components/rfq/InviteSupplierModal';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  OPEN: 'green', CLOSED: 'gray', AWARDED: 'blue', CANCELLED: 'red',
};
const QUOTE_STATUS_COLORS: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  PENDING: 'amber', ACCEPTED: 'green', REJECTED: 'red', WITHDRAWN: 'gray',
};

export default function RFQDetailPage() {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ar = locale === 'ar';

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [rfqImages, setRfqImages] = useState<RfqImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [dealByQuoteId, setDealByQuoteId] = useState<Record<string, string>>({});
  const [expandedBoq, setExpandedBoq] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const justPosted = searchParams?.get('posted') === '1';

  const fetchData = async () => {
    try {
      const [rfqRes, quotesRes] = await Promise.all([
        api.get(`/rfqs/${id}`),
        api.get(`/quotes/rfq/${id}`),
      ]);
      const rfqData = rfqRes.data.data;
      setRfq(rfqData);
      setRfqImages(rfqData?.images ?? []);
      const fetchedQuotes: Quote[] = quotesRes.data.data?.items || quotesRes.data.data || [];
      setQuotes(fetchedQuotes);
      // Fetch deal for accepted quotes to enable direct link
      const accepted = fetchedQuotes.filter((q) => q.status === 'ACCEPTED');
      if (accepted.length > 0) {
        try {
          const dealsRes = await api.get('/deals', { params: { limit: 50 } });
          const deals: any[] = dealsRes.data.data?.items || dealsRes.data.data || [];
          const map: Record<string, string> = {};
          accepted.forEach((q) => {
            const match = deals.find((d: any) => d.quoteId === q.id);
            if (match) map[q.id] = match.id;
          });
          setDealByQuoteId(map);
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleImageUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    const res = await api.post(`/rfqs/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data ?? res.data;
  };

  const handleImageDelete = async (imageId: string) => {
    await api.delete(`/rfqs/${id}/images/${imageId}`);
  };

  useEffect(() => { fetchData(); }, [id]);

  const acceptQuote = async (quoteId: string) => {
    setActionLoading(quoteId);
    try {
      await api.patch(`/quotes/${quoteId}/accept`);
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const rejectQuote = async (quoteId: string) => {
    setActionLoading(`reject-${quoteId}`);
    try {
      await api.patch(`/quotes/${quoteId}/reject`);
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const cancelRFQ = async () => {
    setActionLoading('cancel');
    try {
      await api.patch(`/rfqs/${id}/cancel`);
      router.push(`/${locale}/dashboard/buyer/rfqs`);
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const startConversation = async (supplierId: string) => {
    try {
      const res = await api.post('/conversations/start', {
        participantCompanyId: supplierId,
        subject: rfq?.title,
      });
      router.push(`/${locale}/dashboard/messages/${res.data.data.id}`);
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!rfq) return (
    <DashboardLayout>
      <div className="text-center py-20 text-slate-500">{ar ? 'لم يتم العثور على الطلب' : 'RFQ not found'}</div>
    </DashboardLayout>
  );

  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING');
  const canAccept = rfq.status === 'OPEN' && pendingQuotes.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back + title */}
        <div className="flex items-start gap-3">
          <Link href={`/${locale}/dashboard/buyer/rfqs`} className="btn-ghost p-2 mt-1">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 truncate">{rfq.title}</h1>
              <Badge variant={STATUS_COLORS[rfq.status]}>
                {rfq.status === 'OPEN' ? (ar ? 'مفتوح' : 'Open')
                  : rfq.status === 'AWARDED' ? (ar ? 'مُرسى' : 'Awarded')
                  : rfq.status === 'CLOSED' ? (ar ? 'مغلق' : 'Closed')
                  : (ar ? 'ملغى' : 'Cancelled')}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {ar ? 'نُشر في' : 'Posted'} {format(new Date(rfq.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          {rfq.status === 'OPEN' && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={() => setShowInviteModal(true)}
              >
                {ar ? 'دعوة موردين' : 'Invite Suppliers'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmCancel(true)}
                loading={actionLoading === 'cancel'}
              >
                {ar ? 'إلغاء الطلب' : 'Cancel RFQ'}
              </Button>
            </div>
          )}
        </div>

        {/* Success banner — shown after posting */}
        {justPosted && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">
                {ar ? 'تم نشر طلبك بنجاح!' : 'Your RFQ has been posted!'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {ar
                  ? 'سيتلقى الموردون الموثقون إشعاراً بطلبك وسيبدأون في تقديم عروضهم.'
                  : 'Verified suppliers have been notified and will start submitting their offers shortly.'}
              </p>
            </div>
          </div>
        )}

        {/* Cancel confirmation */}
        {confirmCancel && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">
                {ar ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {ar ? 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع.' : 'Are you sure you want to cancel this RFQ? This cannot be undone.'}
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="danger" size="sm" onClick={cancelRFQ} loading={actionLoading === 'cancel'}>
                  {ar ? 'نعم، إلغاء' : 'Yes, Cancel'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmCancel(false)}>
                  {ar ? 'لا' : 'No'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RFQ details card */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{ar ? 'تفاصيل الطلب' : 'Request Details'}</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">{rfq.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {rfq.category && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Tag className="h-4 w-4 text-slate-400" />
                <span>{ar ? rfq.category.nameAr : rfq.category.nameEn}</span>
              </div>
            )}
            {rfq.quantity && rfq.unit && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="h-4 w-4 text-slate-400" />
                <span>{rfq.quantity} {rfq.unit}</span>
              </div>
            )}
            {rfq.budget && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span>{rfq.budget.toLocaleString()} SAR</span>
              </div>
            )}
            {rfq.deadline && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{format(new Date(rfq.deadline), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-800">
              {ar ? `الصور (${rfqImages.length}/8)` : `Images (${rfqImages.length}/8)`}
            </h2>
          </div>

          {rfqImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {rfqImages.map((img) => {
                const src = img.url.startsWith('http')
                  ? img.url
                  : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001'}${img.url}`;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(src)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={img.filename} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          {rfq.status === 'OPEN' && rfqImages.length < 8 && (
            <ImageUploader
              value={rfqImages.map((img) => ({ id: img.id, url: img.url, filename: img.filename }))}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              onChange={(imgs) => setRfqImages(imgs.map((i) => ({ ...i, mimeType: '', size: 0, sortOrder: 0, rfqId: id, createdAt: '' })))}
              maxImages={8}
              label={undefined}
              hint={ar ? 'JPEG, PNG, WebP — حد أقصى 5 ميجابايت' : 'JPEG, PNG, WebP — max 5 MB each'}
            />
          )}
        </div>

        {/* Lightbox */}
        {activeImg && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setActiveImg(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImg} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        )}

        {/* Quotes */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">
            {ar ? `العروض المقدمة (${quotes.length})` : `Received Quotes (${quotes.length})`}
          </h2>

          {quotes.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-600">{ar ? 'لا توجد عروض بعد' : 'No quotes yet'}</p>
              <p className="text-sm text-slate-400 mt-1">
                {ar ? 'سيتقدم الموردون بعروضهم قريباً' : 'Suppliers will submit their offers soon'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes
                .sort((a, b) => a.price - b.price) // sort by price ascending
                .map((quote, idx) => {
                  const isBest = idx === 0 && quote.status === 'PENDING';
                  return (
                    <div
                      key={quote.id}
                      className={`card relative ${isBest ? 'border-brand-200 ring-1 ring-brand-200' : ''}`}
                    >
                      {isBest && (
                        <div className="absolute top-3 end-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-medium text-white">
                            <Star className="h-3 w-3" />
                            {ar ? 'أفضل سعر' : 'Best Price'}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Supplier */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">
                            {(quote.supplier?.nameEn || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {ar ? quote.supplier?.nameAr : quote.supplier?.nameEn}
                            </p>
                            <p className="text-xs text-slate-400">{quote.supplier?.city}</p>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex-1">
                          <p className="text-xl font-bold text-brand-700">
                            {quote.price.toLocaleString()} <span className="text-sm font-normal text-slate-400">SAR</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {quote.deliveryDays && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {ar ? `${quote.deliveryDays} يوم` : `${quote.deliveryDays}d delivery`}
                              </span>
                            )}
                            {quote.vatPercent !== undefined && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                {ar ? `ضريبة ${quote.vatPercent}%` : `VAT ${quote.vatPercent}%`}
                              </span>
                            )}
                            {quote.paymentTerms && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {quote.paymentTerms}
                              </span>
                            )}
                            {quote.warrantyMonths !== undefined && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                {ar ? `ضمان ${quote.warrantyMonths} شهر` : `${quote.warrantyMonths}mo warranty`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={QUOTE_STATUS_COLORS[quote.status]}>
                            {quote.status === 'PENDING' ? (ar ? 'معلق' : 'Pending')
                              : quote.status === 'ACCEPTED' ? (ar ? 'مقبول' : 'Accepted')
                              : quote.status === 'REJECTED' ? (ar ? 'مرفوض' : 'Rejected')
                              : (ar ? 'مسحوب' : 'Withdrawn')}
                          </Badge>

                          {rfq.status === 'OPEN' && quote.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                loading={actionLoading === quote.id}
                                onClick={() => acceptQuote(quote.id)}
                              >
                                {ar ? 'قبول' : 'Accept'}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={<XCircle className="h-3.5 w-3.5" />}
                                loading={actionLoading === `reject-${quote.id}`}
                                onClick={() => rejectQuote(quote.id)}
                              >
                                {ar ? 'رفض' : 'Reject'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<MessageSquare className="h-3.5 w-3.5" />}
                                onClick={() => startConversation(quote.supplierId)}
                              >
                                {ar ? 'تواصل' : 'Chat'}
                              </Button>
                            </div>
                          )}

                          {quote.status === 'ACCEPTED' && (
                            <Link href={dealByQuoteId[quote.id]
                              ? `/${locale}/dashboard/buyer/deals/${dealByQuoteId[quote.id]}`
                              : `/${locale}/dashboard/buyer/deals`}>
                              <Button size="sm" variant="secondary">
                                {ar ? 'عرض الصفقة' : 'View Deal'}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Enterprise fields: after-sales + technical proposal */}
                      {(quote.afterSalesSupport || quote.technicalProposal || quote.notes) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          {quote.afterSalesSupport && (
                            <p className="text-xs text-slate-500">
                              <span className="font-medium text-slate-600">{ar ? 'خدمة ما بعد البيع: ' : 'After-sales: '}</span>
                              {quote.afterSalesSupport}
                            </p>
                          )}
                          {quote.technicalProposal && (
                            <p className="text-xs text-slate-500 line-clamp-2">
                              <span className="font-medium text-slate-600">{ar ? 'المقترح التقني: ' : 'Technical: '}</span>
                              {quote.technicalProposal}
                            </p>
                          )}
                          {quote.notes && (
                            <p className="text-xs text-slate-500">
                              <span className="font-medium text-slate-600">{ar ? 'ملاحظات: ' : 'Notes: '}</span>
                              {quote.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* BOQ collapsible */}
                      {quote.lineItems && quote.lineItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => setExpandedBoq(expandedBoq === quote.id ? null : quote.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-700 transition-colors"
                          >
                            {ar ? `جدول الكميات (${quote.lineItems.length} بند)` : `BOQ (${quote.lineItems.length} items)`}
                            {expandedBoq === quote.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {expandedBoq === quote.id && (
                            <div className="mt-2 overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 text-slate-500">
                                    <th className="pb-1.5 text-left font-medium">{ar ? 'البند' : 'Description'}</th>
                                    <th className="pb-1.5 text-right font-medium">{ar ? 'ك' : 'Qty'}</th>
                                    <th className="pb-1.5 text-right font-medium">{ar ? 'وحدة' : 'Unit'}</th>
                                    <th className="pb-1.5 text-right font-medium">{ar ? 'سعر' : 'Price'}</th>
                                    <th className="pb-1.5 text-right font-medium">{ar ? 'إجمالي' : 'Total'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {quote.lineItems.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                      <td className="py-1 text-slate-700">{item.description}</td>
                                      <td className="py-1 text-right text-slate-500">{item.qty}</td>
                                      <td className="py-1 text-right text-slate-400">{item.unit}</td>
                                      <td className="py-1 text-right text-slate-500">{item.unitPrice.toLocaleString()}</td>
                                      <td className="py-1 text-right font-medium text-slate-700">{(item.qty * item.unitPrice).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteSupplierModal rfqId={id} onClose={() => setShowInviteModal(false)} />
      )}
    </DashboardLayout>
  );
}

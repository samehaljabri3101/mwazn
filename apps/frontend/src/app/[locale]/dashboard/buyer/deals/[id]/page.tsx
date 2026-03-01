'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { Deal } from '@/types';
import {
  ChevronLeft, DollarSign, Download, Star, MessageSquare,
  CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_META: Record<string, { color: 'green' | 'blue' | 'amber' | 'gray' | 'red'; en: string; ar: string }> = {
  AWARDED:     { color: 'amber', en: 'Awarded',     ar: 'مُرسى' },
  IN_PROGRESS: { color: 'blue',  en: 'In Progress', ar: 'قيد التنفيذ' },
  DELIVERED:   { color: 'green', en: 'Delivered',   ar: 'تم التسليم' },
  COMPLETED:   { color: 'green', en: 'Completed',   ar: 'مكتملة' },
  CANCELLED:   { color: 'red',   en: 'Cancelled',   ar: 'ملغاة' },
};
const STATUS_ORDER = ['AWARDED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];

function RatingModal({ dealId, onClose, onDone }: { dealId: string; onClose: () => void; onDone: () => void }) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/ratings', { dealId, score, comment });
      onDone();
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-1">{ar ? 'قيّم المورد' : 'Rate the Supplier'}</h3>
        <p className="text-sm text-slate-500 mb-6">{ar ? 'شاركنا تجربتك مع هذا المورد' : 'Share your experience with this supplier'}</p>
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className={`text-3xl transition-transform ${s <= score ? 'text-amber-400' : 'text-slate-200'} hover:scale-110`}
            >★</button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={ar ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
          className="input-base resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{ar ? 'إلغاء' : 'Cancel'}</Button>
          <Button loading={loading} icon={<Star className="h-4 w-4" />} onClick={submit}>
            {ar ? 'إرسال التقييم' : 'Submit Rating'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BuyerDealDetailPage() {
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ar = locale === 'ar';
  const { company } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [boqExpanded, setBoqExpanded] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchDeal = async () => {
    try {
      const res = await api.get(`/deals/${id}`);
      setDeal(res.data.data);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchDeal(); }, [id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/deals/${id}/status`, { status });
      await fetchDeal();
    } catch { /* silent */ }
    setActionLoading(false);
  };

  const downloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await api.get(`/deals/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    setDownloadingInvoice(false);
  };

  const startConversation = async () => {
    if (!deal?.supplierId) return;
    try {
      const res = await api.post('/conversations/start', { participantCompanyId: deal.supplierId });
      router.push(`/${locale}/dashboard/messages/${res.data.data.id}`);
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500">{ar ? 'لم يتم العثور على الصفقة' : 'Deal not found'}</div>
      </DashboardLayout>
    );
  }

  const meta = STATUS_META[deal.status];
  const currentIdx = STATUS_ORDER.indexOf(deal.status);
  const hasRated = deal.ratings?.some((r) => r.raterId === company?.id) ?? !!deal.rating;
  const canRate = deal.status === 'COMPLETED' && !hasRated;
  const quote = deal.quote;
  const lineItems = quote?.lineItems ?? [];

  return (
    <DashboardLayout>
      {showRating && (
        <RatingModal
          dealId={deal.id}
          onClose={() => setShowRating(false)}
          onDone={() => { setShowRating(false); fetchDeal(); }}
        />
      )}

      <div className="space-y-6 max-w-3xl">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/buyer/deals`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 truncate">
                {ar ? deal.supplier?.nameAr : deal.supplier?.nameEn}
              </h1>
              <Badge variant={meta.color}>{ar ? meta.ar : meta.en}</Badge>
            </div>
            {deal.quote?.rfq && (
              <p className="text-sm text-slate-500 mt-0.5">{deal.quote.rfq.title}</p>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{ar ? 'حالة الصفقة' : 'Deal Progress'}</h2>
          <div className="flex items-center">
            {STATUS_ORDER.map((s, i) => {
              const sm = STATUS_META[s];
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      done ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-400'
                    } ${active ? 'ring-2 ring-brand-300 ring-offset-2' : ''}`}>
                      {done && !active ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] text-center hidden sm:block ${done ? 'text-brand-700 font-medium' : 'text-slate-400'}`}>
                      {ar ? sm.ar : sm.en}
                    </span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-brand-700' : 'bg-slate-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal summary */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{ar ? 'ملخص الصفقة' : 'Deal Summary'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">{ar ? 'قيمة الصفقة' : 'Deal Value'}</p>
              <p className="font-bold text-brand-700 text-lg flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {deal.totalAmount.toLocaleString()} SAR
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">{ar ? 'تاريخ الإنشاء' : 'Created'}</p>
              <p className="font-medium text-slate-800">{format(new Date(deal.createdAt), 'dd MMM yyyy')}</p>
            </div>
            {deal.supplier && (
              <div>
                <p className="text-slate-500 text-xs">{ar ? 'المورد' : 'Supplier'}</p>
                <p className="font-medium text-slate-800">{ar ? deal.supplier.nameAr : deal.supplier.nameEn}</p>
              </div>
            )}
          </div>

          {deal.quote?.rfq && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">{ar ? 'طلب العرض المرتبط' : 'Related RFQ'}</p>
              <p className="text-sm font-medium text-slate-800">{deal.quote.rfq.title}</p>
              {deal.quote.rfq.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{deal.quote.rfq.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Quote detail */}
        {quote && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">{ar ? 'تفاصيل العرض' : 'Quote Details'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">{ar ? 'السعر' : 'Price'}</p>
                <p className="font-bold text-slate-800">{quote.price.toLocaleString()} SAR</p>
              </div>
              {quote.vatPercent !== undefined && (
                <div>
                  <p className="text-slate-500 text-xs">{ar ? 'ضريبة القيمة المضافة' : 'VAT'}</p>
                  <p className="font-medium text-slate-800">{quote.vatPercent}%</p>
                </div>
              )}
              {quote.deliveryDays && (
                <div>
                  <p className="text-slate-500 text-xs">{ar ? 'مدة التسليم' : 'Delivery'}</p>
                  <p className="font-medium text-slate-800">{quote.deliveryDays} {ar ? 'يوم' : 'days'}</p>
                </div>
              )}
              {quote.paymentTerms && (
                <div>
                  <p className="text-slate-500 text-xs">{ar ? 'شروط الدفع' : 'Payment Terms'}</p>
                  <p className="font-medium text-slate-800">{quote.paymentTerms}</p>
                </div>
              )}
              {quote.warrantyMonths !== undefined && (
                <div>
                  <p className="text-slate-500 text-xs">{ar ? 'الضمان' : 'Warranty'}</p>
                  <p className="font-medium text-slate-800">{quote.warrantyMonths} {ar ? 'شهر' : 'months'}</p>
                </div>
              )}
              {quote.afterSalesSupport && (
                <div className="col-span-2">
                  <p className="text-slate-500 text-xs">{ar ? 'خدمة ما بعد البيع' : 'After-Sales Support'}</p>
                  <p className="font-medium text-slate-800">{quote.afterSalesSupport}</p>
                </div>
              )}
            </div>

            {quote.technicalProposal && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">{ar ? 'المقترح التقني' : 'Technical Proposal'}</p>
                <p className="text-sm text-slate-700 line-clamp-3">{quote.technicalProposal}</p>
              </div>
            )}

            {quote.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">{ar ? 'ملاحظات' : 'Notes'}</p>
                <p className="text-sm text-slate-700">{quote.notes}</p>
              </div>
            )}

            {/* BOQ table */}
            {lineItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setBoqExpanded((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-700 transition-colors"
                >
                  {ar ? `جدول الكميات (${lineItems.length} بند)` : `Bill of Quantities (${lineItems.length} items)`}
                  {boqExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {boqExpanded && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                          <th className="pb-2 font-medium">{ar ? 'البند' : 'Description'}</th>
                          <th className="pb-2 font-medium text-right">{ar ? 'الكمية' : 'Qty'}</th>
                          <th className="pb-2 font-medium text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                          <th className="pb-2 font-medium text-right">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                          <th className="pb-2 font-medium text-right">{ar ? 'الإجمالي' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, i) => (
                          <tr key={i} className="border-b border-slate-50">
                            <td className="py-2 text-slate-700">{item.description}</td>
                            <td className="py-2 text-right text-slate-600">{item.qty}</td>
                            <td className="py-2 text-right text-slate-500">{item.unit}</td>
                            <td className="py-2 text-right text-slate-600">{item.unitPrice.toLocaleString()}</td>
                            <td className="py-2 text-right font-medium text-slate-800">
                              {(item.qty * item.unitPrice).toLocaleString()} SAR
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="pt-3 text-right font-semibold text-slate-700 text-sm">
                            {ar ? 'الإجمالي' : 'Total'}
                          </td>
                          <td className="pt-3 text-right font-bold text-brand-700">
                            {lineItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0).toLocaleString()} SAR
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ratings display */}
        {deal.ratings && deal.ratings.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3">{ar ? 'التقييمات' : 'Ratings'}</h2>
            <div className="space-y-3">
              {deal.ratings.map((r) => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {deal.status === 'DELIVERED' && (
            <Button
              loading={actionLoading}
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => updateStatus('COMPLETED')}
            >
              {ar ? 'إتمام الصفقة' : 'Mark Completed'}
            </Button>
          )}

          {canRate && (
            <Button
              variant="secondary"
              icon={<Star className="h-4 w-4" />}
              onClick={() => setShowRating(true)}
            >
              {ar ? 'قيّم المورد' : 'Rate Supplier'}
            </Button>
          )}

          <Button
            variant="secondary"
            icon={<MessageSquare className="h-4 w-4" />}
            onClick={startConversation}
          >
            {ar ? 'تواصل مع المورد' : 'Chat with Supplier'}
          </Button>

          {deal.status === 'COMPLETED' && (
            <Button
              variant="ghost"
              loading={downloadingInvoice}
              icon={<Download className="h-4 w-4" />}
              onClick={downloadInvoice}
            >
              {ar ? 'تحميل الفاتورة (XML)' : 'Download Invoice (XML)'}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

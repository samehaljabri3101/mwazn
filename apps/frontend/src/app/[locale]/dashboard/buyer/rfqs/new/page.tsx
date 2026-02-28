'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Category } from '@/types';
import { FileText, ChevronLeft, Layers } from 'lucide-react';
import Link from 'next/link';

const UNITS = ['piece', 'kg', 'ton', 'liter', 'meter', 'box', 'pallet', 'set', 'unit'];
const UNITS_AR = ['قطعة', 'كجم', 'طن', 'لتر', 'متر', 'صندوق', 'منصة', 'طقم', 'وحدة'];

// Sector templates for common Saudi B2B industries
const TEMPLATES = [
  {
    id: 'construction',
    icon: '🏗️',
    label: { en: 'Construction Materials', ar: 'مواد بناء' },
    form: {
      title: 'Request for Construction Materials',
      description: 'We require construction materials for our ongoing project. Please provide your best offer including: steel rebar (specified grade), cement (specified type), aggregate, and any other materials as detailed in the attached specifications. Delivery to project site required. Please include pricing, lead time, and payment terms.',
      unit: 'ton',
      quantity: '500',
    },
  },
  {
    id: 'it',
    icon: '💻',
    label: { en: 'IT Equipment', ar: 'معدات تقنية' },
    form: {
      title: 'Request for IT Equipment & Supplies',
      description: 'We are seeking quotes for IT hardware and equipment. Requirements include laptops, monitors, networking equipment, and accessories. All equipment must be brand new, with manufacturer warranty, and meet our technical specifications. Please include delivery timeline and installation support.',
      unit: 'piece',
      quantity: '50',
    },
  },
  {
    id: 'office',
    icon: '🪑',
    label: { en: 'Office Furniture', ar: 'أثاث مكتبي' },
    form: {
      title: 'Request for Office Furniture and Equipment',
      description: 'We require office furniture for our new office space. Items needed include executive desks, ergonomic chairs, meeting room tables, filing cabinets, and reception furniture. All items must meet our quality standards and be assembled/delivered to our premises.',
      unit: 'set',
      quantity: '20',
    },
  },
  {
    id: 'food',
    icon: '🥗',
    label: { en: 'Food & Beverages', ar: 'أغذية ومشروبات' },
    form: {
      title: 'Monthly Food & Beverage Supply Contract',
      description: 'We are looking for a reliable food and beverage supplier for our facility. Requirements include: fresh and packaged food items, beverages, and catering supplies. Monthly delivery schedule required. All products must comply with SFDA regulations and have valid halal certification.',
      unit: 'kg',
      quantity: '1000',
    },
  },
  {
    id: 'safety',
    icon: '🦺',
    label: { en: 'Safety Equipment', ar: 'معدات السلامة' },
    form: {
      title: 'Request for Safety & PPE Equipment',
      description: 'We require personal protective equipment (PPE) and safety supplies for our workforce. Items include: hard hats, safety vests, gloves, safety boots, respirators, and first aid kits. All equipment must meet Saudi SASO standards and applicable safety regulations. Please quote for monthly supply.',
      unit: 'piece',
      quantity: '200',
    },
  },
  {
    id: 'cleaning',
    icon: '🧹',
    label: { en: 'Cleaning Supplies', ar: 'مستلزمات تنظيف' },
    form: {
      title: 'Monthly Cleaning & Maintenance Supplies',
      description: 'We require a monthly supply of cleaning and maintenance products for our facility. Items include: industrial cleaners, disinfectants, janitorial supplies, trash bags, and maintenance tools. Eco-friendly and SASO-certified products preferred. Please provide unit pricing and minimum order quantities.',
      unit: 'box',
      quantity: '100',
    },
  },
];

export default function NewRFQPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ar = locale === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: searchParams?.get('title') || '',
    description: '',
    categoryId: searchParams?.get('categoryId') || '',
    quantity: '',
    unit: '',
    budget: '',
    deadline: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.data?.items || res.data.data || []);
    }).catch(() => {});
  }, []);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setForm((p) => ({
      ...p,
      title: ar ? `طلب: ${tpl.label.ar}` : tpl.form.title,
      description: tpl.form.description,
      unit: tpl.form.unit,
      quantity: tpl.form.quantity,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/rfqs', {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        unit: form.unit || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: 'SAR',
        deadline: form.deadline || undefined,
      });
      router.push(`/${locale}/dashboard/buyer/rfqs`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'حدث خطأ. حاول مجدداً.' : 'Failed to create RFQ. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}/dashboard/buyer/rfqs`} className="btn-ghost p-2">
            <ChevronLeft className="h-5 w-5 rtl-mirror" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {ar ? 'طلب عرض سعر جديد' : 'Create New RFQ'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? 'أخبر الموردين بما تحتاجه' : 'Tell suppliers what you need'}
            </p>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {ar ? 'قوالب جاهزة للقطاعات' : 'Quick-Start Templates'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedTemplate === tpl.id
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span>{tpl.icon}</span>
                {ar ? tpl.label.ar : tpl.label.en}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="label-base">{ar ? 'العنوان *' : 'Title *'}</label>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={ar ? 'مثال: مطلوب مواد بناء لمشروع الرياض' : 'e.g. Steel pipes for Riyadh construction project'}
              required
            />
          </div>

          <div>
            <label className="label-base">{ar ? 'التفاصيل *' : 'Description *'}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5}
              placeholder={ar
                ? 'اذكر المواصفات والمتطلبات بتفصيل...'
                : 'Describe the specifications and requirements in detail...'}
              className="input-base resize-none"
              required
            />
          </div>

          <div>
            <label className="label-base">{ar ? 'الفئة' : 'Category'}</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="input-base"
            >
              <option value="">{ar ? 'اختر الفئة' : 'Select a category'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {ar ? cat.nameAr : cat.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">{ar ? 'الكمية' : 'Quantity'}</label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="label-base">{ar ? 'الوحدة' : 'Unit'}</label>
              <select
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="input-base"
              >
                <option value="">{ar ? 'اختر' : 'Select'}</option>
                {UNITS.map((u, i) => (
                  <option key={u} value={u}>{ar ? UNITS_AR[i] : u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">{ar ? 'الميزانية التقديرية (ريال)' : 'Budget (SAR)'}</label>
              <Input
                type="number"
                min="1"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="50,000"
              />
            </div>
            <div>
              <label className="label-base">{ar ? 'آخر موعد للعروض' : 'Deadline'}</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {ar ? '💡 نصائح للحصول على أفضل العروض' : '💡 Tips for better quotes'}
            </p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              {(ar ? [
                'كن محدداً في المواصفات والكميات',
                'اذكر معايير الجودة المطلوبة (SASO، ISO...)',
                'حدد تاريخ التسليم المطلوب',
                'أرفق صور أو مستندات للمنتج المطلوب',
              ] : [
                'Be specific about specifications and quantities',
                'Mention quality standards required (SASO, ISO...)',
                'Include delivery timeline expectations',
                'Attach images or documents if available',
              ]).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href={`/${locale}/dashboard/buyer/rfqs`}>
              <Button variant="secondary">{ar ? 'إلغاء' : 'Cancel'}</Button>
            </Link>
            <Button
              type="submit"
              loading={loading}
              icon={<FileText className="h-4 w-4" />}
              disabled={!form.title || !form.description}
            >
              {ar ? 'نشر الطلب' : 'Post RFQ'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

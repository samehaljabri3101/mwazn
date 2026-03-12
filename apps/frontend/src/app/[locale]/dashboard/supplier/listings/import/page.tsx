'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import {
  Download, Upload, CheckCircle2, AlertCircle, FileSpreadsheet,
  ChevronLeft, Loader2,
} from 'lucide-react';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export default function BulkImportPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const ar = locale === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Guard: redirect if not a seller
  if (user && user.role !== 'SUPPLIER_ADMIN' && user.role !== 'FREELANCER') {
    router.replace(`/${locale}/dashboard`);
    return null;
  }

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/listings/bulk-import/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mwazn-bulk-import-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(ar ? 'فشل تنزيل النموذج' : 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/listings/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data ?? res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || (ar ? 'فشل الاستيراد' : 'Import failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/dashboard/supplier/listings`} className="text-slate-400 hover:text-slate-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ar ? 'استيراد المنتجات بالجملة' : 'Bulk Product Import'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {ar ? 'استيراد عدة منتجات دفعة واحدة من ملف Excel' : 'Import multiple products at once from an Excel file'}
            </p>
          </div>
        </div>

        {/* Step 1: Download template */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold text-sm">1</div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">
                {ar ? 'تنزيل نموذج Excel' : 'Download Excel Template'}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                {ar
                  ? 'نزّل النموذج واملأه بمنتجاتك. لا تغيّر أسماء الأعمدة.'
                  : 'Download the template, fill it with your products. Do not change column headers.'}
              </p>
              <Button
                variant="secondary"
                icon={downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                onClick={handleDownloadTemplate}
                loading={downloading}
              >
                {ar ? 'تنزيل النموذج (.xlsx)' : 'Download Template (.xlsx)'}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold text-sm">2</div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-1">
                {ar ? 'رفع الملف' : 'Upload File'}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                {ar ? 'اختر ملف Excel (.xlsx) مملوءاً' : 'Select your filled Excel (.xlsx) file'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                {file ? (
                  <div>
                    <p className="font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500">{ar ? 'انقر لاختيار ملف .xlsx' : 'Click to select .xlsx file'}</p>
                    <p className="text-xs text-slate-400 mt-1">{ar ? 'الحجم الأقصى 10 ميغابايت' : 'Max 10 MB'}</p>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-4">
                  <Button
                    onClick={handleUpload}
                    loading={uploading}
                    disabled={uploading}
                    icon={<Upload className="h-4 w-4" />}
                  >
                    {uploading ? (ar ? 'جارٍ الاستيراد...' : 'Importing...') : (ar ? 'بدء الاستيراد' : 'Start Import')}
                  </Button>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Results */}
        {result && (
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold text-sm">3</div>
              <div className="flex-1">
                <h2 className="font-semibold text-slate-800 mb-4">
                  {ar ? 'نتيجة الاستيراد' : 'Import Results'}
                </h2>

                {/* Summary chips */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2">
                    <span className="text-xs text-slate-500">{ar ? 'المجموع' : 'Total'}</span>
                    <span className="font-bold text-slate-800">{result.total}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-emerald-700">{ar ? 'مستورد' : 'Imported'}</span>
                    <span className="font-bold text-emerald-800">{result.imported}</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-700">{ar ? 'فشل' : 'Failed'}</span>
                      <span className="font-bold text-red-800">{result.failed}</span>
                    </div>
                  )}
                </div>

                {result.imported > 0 && result.failed === 0 && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {ar ? `تم استيراد ${result.imported} منتج بنجاح!` : `Successfully imported ${result.imported} product(s)!`}
                  </div>
                )}

                {/* Error table */}
                {result.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      {ar ? 'الأخطاء' : 'Errors'}
                    </h3>
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-start font-semibold text-slate-600">{ar ? 'الصف' : 'Row'}</th>
                            <th className="px-3 py-2 text-start font-semibold text-slate-600">{ar ? 'الحقل' : 'Field'}</th>
                            <th className="px-3 py-2 text-start font-semibold text-slate-600">{ar ? 'الخطأ' : 'Error'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.errors.map((e, i) => (
                            <tr key={i} className="bg-white">
                              <td className="px-3 py-2 font-mono text-slate-500">{e.row}</td>
                              <td className="px-3 py-2 text-amber-700 font-medium">{e.field}</td>
                              <td className="px-3 py-2 text-red-600">{e.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {result.imported > 0 && (
                  <div className="mt-4">
                    <Link href={`/${locale}/dashboard/supplier/listings`}>
                      <Button variant="secondary">
                        {ar ? 'عرض المنتجات المستوردة' : 'View Imported Products'}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

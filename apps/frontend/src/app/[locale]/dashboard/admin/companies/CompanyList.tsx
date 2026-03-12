'use client';

import { AlertTriangle, Building2, ChevronRight } from 'lucide-react';
import {
  type CompanyWithDocs, type FilterState,
  getWarnings, hasCriticalWarning, getEffectiveStatus, applyFilters, fmtDate,
  DEFAULT_FILTERS,
} from './_utils';

// ─── Status dot ───────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red:   'bg-red-500',
  blue:  'bg-blue-500',
  gray:  'bg-slate-400',
};

const STATUS_TEXT: Record<string, string> = {
  green: 'text-emerald-700',
  amber: 'text-amber-700',
  red:   'text-red-600',
  blue:  'text-blue-700',
  gray:  'text-slate-500',
};

// ─── Single row ───────────────────────────────────────────────────────────────

function CompanyRow({
  company,
  isSelected,
  onSelect,
  ar,
}: {
  company: CompanyWithDocs;
  isSelected: boolean;
  onSelect: () => void;
  ar: boolean;
}) {
  const warnings  = getWarnings(company);
  const critical  = hasCriticalWarning(warnings);
  const status    = getEffectiveStatus(company);
  const primary   = ar ? company.nameAr : company.nameEn;
  const secondary = ar ? company.nameEn : company.nameAr;
  const sector    = company.sectors?.[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full text-start px-4 py-3.5 transition-all duration-150 focus:outline-none',
        'border-l-2',
        isSelected
          ? 'bg-brand-50 border-brand-600'
          : 'bg-white border-transparent hover:bg-slate-50/80 hover:border-slate-200',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold mt-0.5',
            isSelected ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600',
          ].join(' ')}
        >
          {primary.charAt(0).toUpperCase()}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + type badge */}
          <div className="flex items-start justify-between gap-2">
            <p className={[
              'text-sm font-semibold leading-tight truncate',
              isSelected ? 'text-brand-800' : 'text-slate-800',
            ].join(' ')}>
              {primary}
            </p>
            <span className={[
              'shrink-0 text-[10px] font-semibold rounded-md px-1.5 py-0.5',
              company.type === 'SUPPLIER'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700',
            ].join(' ')}>
              {ar ? (company.type === 'SUPPLIER' ? 'مورّد' : 'مشترٍ') : company.type}
            </span>
          </div>

          {/* Row 2: CR + city */}
          <p className="mt-0.5 text-[11px] text-slate-400 truncate">
            <span className="font-mono">{company.crNumber}</span>
            {company.city && <span className="before:content-['·'] before:mx-1.5">{company.city}</span>}
            {sector && <span className="before:content-['·'] before:mx-1.5">{sector}</span>}
          </p>

          {/* Row 3: status + plan + warnings */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {/* Effective status */}
            <span className={`flex items-center gap-1 text-[10px] font-medium ${STATUS_TEXT[status.color]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status.color]}`} />
              {ar ? status.labelAr : status.labelEn}
            </span>

            {/* Plan badge */}
            <span className={[
              'text-[10px] font-bold rounded-md px-1.5 py-0.5',
              company.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500',
            ].join(' ')}>
              {company.plan}
            </span>

            {/* Warning indicator */}
            {warnings.length > 0 && (
              <span className={[
                'inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5',
                critical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
              ].join(' ')}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {warnings.length}
              </span>
            )}

            {/* Date — pushed to right on wide rows */}
            <span className="ms-auto text-[10px] text-slate-400 shrink-0">
              {fmtDate(company.createdAt, ar ? 'ar' : 'en')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── List panel ───────────────────────────────────────────────────────────────

export function CompanyList({
  companies,
  allCompanies,
  filters,
  selectedId,
  onSelect,
  loading,
  ar,
}: {
  companies: CompanyWithDocs[];
  allCompanies: CompanyWithDocs[];
  filters: FilterState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  ar: boolean;
}) {
  const isFiltered =
    filters.search || filters.type || filters.status || filters.plan ||
    filters.sort !== 'newest';

  return (
    <div className="overflow-y-auto divide-y divide-slate-100 rounded-b-2xl">
      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {ar ? 'لا توجد شركات' : 'No companies found'}
          </p>
          {isFiltered && (
            <p className="text-xs text-slate-400 mt-1">
              {ar ? 'جرّب تعديل معايير البحث' : 'Try adjusting your filters'}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-xs text-slate-500">
              {companies.length}{' '}
              {ar
                ? `${companies.length === 1 ? 'شركة' : 'شركة'} ${isFiltered ? '(مُصفّاة)' : ''}`
                : `compan${companies.length === 1 ? 'y' : 'ies'}${isFiltered ? ' (filtered)' : ''}`}
            </p>
          </div>
          {companies.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              isSelected={selectedId === company.id}
              onSelect={() => onSelect(company.id)}
              ar={ar}
            />
          ))}
        </>
      )}
    </div>
  );
}

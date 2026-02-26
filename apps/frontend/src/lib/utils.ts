import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'SAR', locale = 'en-SA') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, locale = 'en-SA') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getCompanyName(company: { nameAr: string; nameEn: string }, locale: string) {
  return locale === 'ar' ? company.nameAr : company.nameEn;
}

export function getCategoryName(category: { nameAr: string; nameEn: string }, locale: string) {
  return locale === 'ar' ? category.nameAr : category.nameEn;
}

export function getDealStatusColor(status: string) {
  const map: Record<string, string> = {
    AWARDED:     'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    DELIVERED:   'bg-purple-100 text-purple-700',
    COMPLETED:   'bg-green-100 text-green-700',
    CANCELLED:   'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getRFQStatusColor(status: string) {
  const map: Record<string, string> = {
    OPEN:      'bg-green-100 text-green-700',
    CLOSED:    'bg-gray-100 text-gray-700',
    AWARDED:   'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getQuoteStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING:   'bg-amber-100 text-amber-700',
    ACCEPTED:  'bg-green-100 text-green-700',
    REJECTED:  'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

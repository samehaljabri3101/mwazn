import { getRequestConfig } from 'next-intl/server';

const SUPPORTED = ['en', 'ar'] as const;
type Locale = (typeof SUPPORTED)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const raw = await requestLocale;
  const locale: Locale = SUPPORTED.includes(raw as Locale) ? (raw as Locale) : 'en';
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

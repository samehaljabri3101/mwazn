import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';

const locales = ['en', 'ar'];

export const metadata: Metadata = {
  title: 'Mwazn — Saudi B2B Marketplace | موازن',
  description: "Saudi Arabia's premier B2B marketplace — connect with verified suppliers, post RFQs, and close deals.",
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      {/* Set lang + dir before React hydrates so RTL CSS applies immediately */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('lang','${locale}');document.documentElement.setAttribute('dir','${dir}');`,
        }}
      />
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  );
}

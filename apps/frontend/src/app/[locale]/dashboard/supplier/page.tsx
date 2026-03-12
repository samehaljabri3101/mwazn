import { redirect } from 'next/navigation';

/**
 * /[locale]/dashboard/supplier → redirect to the role-aware dashboard home.
 * The main /dashboard page already renders supplier-specific content.
 * This page exists to catch direct URL access and old links.
 */
export default async function SupplierDashboardRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}

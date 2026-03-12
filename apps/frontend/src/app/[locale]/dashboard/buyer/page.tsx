import { redirect } from 'next/navigation';

/**
 * /[locale]/dashboard/buyer → redirect to the role-aware dashboard home.
 * The main /dashboard page already renders buyer-specific content.
 * This page exists to catch direct URL access and old links.
 */
export default async function BuyerDashboardRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}

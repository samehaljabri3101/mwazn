import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import {
  HomeSections,
  type HomeStat,
  type HomeSupplier,
  type HomeProduct,
  type HomeShowroom,
  type HomeRFQ,
} from './HomeSections';

export const metadata: Metadata = {
  title: 'Mwazn | موازن — Saudi B2B Procurement Marketplace',
  description: "Saudi Arabia's premier B2B marketplace — connect with verified suppliers, post RFQs, and close deals faster. منصة المشتريات B2B السعودية الرائدة.",
  openGraph: {
    title: 'Mwazn | موازن — Saudi B2B Procurement Marketplace',
    description: "Connect with verified Saudi suppliers and post procurement requests on Mwazn.",
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mwazn | موازن — Saudi B2B Marketplace',
    description: "Saudi Arabia's premier B2B procurement platform.",
  },
};

// Server components: prefer internal Docker network URL, fall back to public URL
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch { return null; }
}

export default async function HomePage() {
  await getLocale(); // ensure locale middleware has run

  const [stats, suppliers, products, showrooms, latestRFQs] = await Promise.all([
    fetchJSON<HomeStat>('/marketplace/stats'),
    fetchJSON<HomeSupplier[]>('/marketplace/top-vendors?limit=8'),
    fetchJSON<HomeProduct[]>('/marketplace/top-products?limit=8'),
    fetchJSON<HomeShowroom[]>('/marketplace/featured-showrooms?limit=6'),
    fetchJSON<HomeRFQ[]>('/marketplace/latest-rfqs?limit=6'),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HomeSections
        stats={stats ?? { totalRFQs: 0, totalVendors: 0, totalProducts: 0, totalTransactions: 0 }}
        suppliers={suppliers ?? []}
        products={products ?? []}
        showrooms={showrooms ?? []}
        rfqs={latestRFQs ?? []}
      />
    </div>
  );
}

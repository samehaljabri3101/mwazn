import type { Metadata } from 'next';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/listings/${params.id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const listing = json?.data;
    if (!listing) throw new Error('no listing');

    const titleEn = listing.titleEn || '';
    const titleAr = listing.titleAr || '';
    const title = `${titleEn} | ${titleAr}`;
    const descEn = listing.descriptionEn?.slice(0, 160) ?? `B2B product on Mwazn marketplace`;
    const image = listing.images?.[0]?.url;

    return {
      title: `${title} — Mwazn | موازن`,
      description: descEn,
      openGraph: {
        title,
        description: descEn,
        type: 'website',
        images: image ? [{ url: image, width: 800, height: 800 }] : [],
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title,
        description: descEn,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: 'Product — Mwazn | موازن',
      description: 'B2B product listing on Mwazn marketplace.',
    };
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}

import type { Metadata } from 'next';
import Script from 'next/script';
import { SupplierShowroomClient } from './SupplierShowroomClient';

interface Props {
  params: { locale: string; id: string };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mwazn.sa';

async function fetchShowroom(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${apiUrl}/companies/${id}/showroom`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const data = await fetchShowroom(params.id);
    const company = data?.company;
    if (!company) throw new Error('no company');

    const name = `${company.nameEn} | ${company.nameAr}`;
    const description = company.descriptionEn
      ? company.descriptionEn.slice(0, 160)
      : `Verified Saudi B2B supplier — ${company.city ?? 'Saudi Arabia'}`;

    return {
      title: `${name} — Mwazn | موازن`,
      description,
      openGraph: {
        title: name,
        description,
        type: 'profile',
        images: company.logoUrl ? [{ url: company.logoUrl, width: 400, height: 400 }] : [],
      },
      twitter: {
        card: 'summary',
        title: name,
        description,
        images: company.logoUrl ? [company.logoUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Supplier — Mwazn | موازن',
      description: 'Verified Saudi B2B supplier on Mwazn marketplace.',
    };
  }
}

export default async function SupplierShowroomPage({ params }: Props) {
  let jsonLd: object | null = null;
  try {
    const data = await fetchShowroom(params.id);
    const company = data?.company;
    if (company) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: company.nameEn,
        alternateName: company.nameAr,
        url: `${siteUrl}/${params.locale}/suppliers/${params.id}`,
        logo: company.logoUrl ?? undefined,
        address: company.city ? {
          '@type': 'PostalAddress',
          addressLocality: company.city,
          addressCountry: 'SA',
        } : undefined,
        aggregateRating: data.totalRatings > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: data.averageRating,
          reviewCount: data.totalRatings,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
      };
    }
  } catch { /* skip */ }

  return (
    <>
      {jsonLd && (
        <Script
          id="supplier-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SupplierShowroomClient />
    </>
  );
}

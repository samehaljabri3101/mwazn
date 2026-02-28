import type { Metadata } from 'next';
import { SupplierShowroomClient } from './SupplierShowroomClient';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/companies/${params.id}/showroom`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const company = json?.data?.company;
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

export default function SupplierShowroomPage() {
  return <SupplierShowroomClient />;
}

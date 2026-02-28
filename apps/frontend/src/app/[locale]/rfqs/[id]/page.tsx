import type { Metadata } from 'next';
import RFQDetailClient from './RFQDetailClient';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/rfqs/${params.id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const rfq = data.data;
      return {
        title: `${rfq.title} — Mwazn RFQ`,
        description: rfq.description?.slice(0, 160) || 'Open procurement request on Mwazn',
        openGraph: {
          title: rfq.title,
          description: rfq.description?.slice(0, 160),
          type: 'article',
        },
        twitter: { card: 'summary', title: rfq.title },
      };
    }
  } catch { /* silent */ }
  return {
    title: 'RFQ Details — Mwazn',
    description: 'View procurement request details on Mwazn',
  };
}

export default function RFQDetailPage({ params }: Props) {
  return <RFQDetailClient id={params.id} />;
}

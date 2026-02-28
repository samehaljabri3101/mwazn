import type { Metadata } from 'next';
import PublicRFQsClient from './PublicRFQsClient';

export const metadata: Metadata = {
  title: 'Open RFQs — Mwazn | طلبات عروض الأسعار — موازن',
  description: 'Browse open procurement requests from verified Saudi buyers. Submit your best quote and win deals on Mwazn.',
  openGraph: {
    title: 'Open RFQs — Mwazn',
    description: 'Browse open RFQs from Saudi buyers and submit competitive quotes.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Open RFQs — Mwazn' },
};

export default function RFQsPage() {
  return <PublicRFQsClient />;
}

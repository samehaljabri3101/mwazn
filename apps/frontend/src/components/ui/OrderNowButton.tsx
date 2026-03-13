'use client';

import { ExternalLink } from 'lucide-react';

interface Props {
  storeUrl: string;
  ar?: boolean;
}

export function OrderNowButton({ storeUrl, ar }: Props) {
  return (
    <a
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-all"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {ar ? 'اطلب الآن' : 'Order Now'}
    </a>
  );
}

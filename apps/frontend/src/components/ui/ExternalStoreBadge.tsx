import { ShoppingBag } from 'lucide-react';

interface Props {
  platform?: string | null;
  storeName?: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  ZID: 'Zid',
  SALLA: 'Salla',
  OTHER: 'Online Store',
};

const PLATFORM_COLORS: Record<string, string> = {
  ZID: 'bg-purple-100 text-purple-700 border-purple-200',
  SALLA: 'bg-green-100 text-green-700 border-green-200',
  OTHER: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function ExternalStoreBadge({ platform, storeName }: Props) {
  const label = platform ? (PLATFORM_LABELS[platform] ?? platform) : 'Online Store';
  const colorClass = platform ? (PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.OTHER) : PLATFORM_COLORS.OTHER;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      <ShoppingBag className="h-3 w-3" />
      {storeName ? `${label}: ${storeName}` : label}
    </span>
  );
}

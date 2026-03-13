interface TrustBadgeProps {
  tier?: string | null;
  size?: 'sm' | 'md';
  ar?: boolean;
}

const TIER_CONFIG: Record<string, { label: string; labelAr: string; className: string }> = {
  TOP_SUPPLIER: {
    label: 'Top Supplier',
    labelAr: 'مورد مميز',
    className: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-amber-300',
  },
  TRUSTED: {
    label: 'Trusted',
    labelAr: 'موثوق',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  VERIFIED: {
    label: 'CR Verified',
    labelAr: 'موثَّق',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

export function TrustBadge({ tier, size = 'md', ar = false }: TrustBadgeProps) {
  if (!tier || tier === 'STANDARD') return null;
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center rounded-full border font-bold ${textSize} ${padding} ${config.className}`}>
      {ar ? config.labelAr : config.label}
    </span>
  );
}

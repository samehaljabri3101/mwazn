interface Props {
  labels: string[];
}

const LABEL_CONFIG: Record<string, { label: string; labelAr: string; className: string }> = {
  BEST_PRICE: {
    label: 'Best Price',
    labelAr: 'أفضل سعر',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  TOP_RATED: {
    label: 'Top Rated',
    labelAr: 'الأعلى تقييماً',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  FASTEST: {
    label: 'Fastest',
    labelAr: 'الأسرع تسليماً',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

export function QuoteRankBadge({ labels }: Props) {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => {
        const config = LABEL_CONFIG[label];
        if (!config) return null;
        return (
          <span
            key={label}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.className}`}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

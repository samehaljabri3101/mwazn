import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  score: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRating({ score, max = 5, size = 'sm', className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            i < Math.floor(score)
              ? 'fill-gold-400 text-gold-400'
              : i < score
              ? 'fill-gold-400/50 text-gold-400'
              : 'fill-slate-200 text-slate-200',
          )}
        />
      ))}
    </div>
  );
}

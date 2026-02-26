import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  className?: string;
}

const colors = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-emerald-50 text-emerald-600',
  amber:  'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  red:    'bg-red-50 text-red-600',
};

export function StatsCard({ title, value, icon, trend, color = 'blue', className }: StatsCardProps) {
  return (
    <Card className={cn('flex items-start gap-4', className)}>
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', colors[color])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 truncate">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
        {trend && (
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </div>
    </Card>
  );
}

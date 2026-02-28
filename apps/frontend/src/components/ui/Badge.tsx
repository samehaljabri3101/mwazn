import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default' | 'gray'
  | 'success' | 'green'
  | 'warning' | 'amber'
  | 'error'   | 'red'
  | 'info'    | 'blue'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  gray:    'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  green:   'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  amber:   'bg-amber-100 text-amber-700',
  error:   'bg-red-100 text-red-700',
  red:     'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  blue:    'bg-blue-100 text-blue-700',
  purple:  'bg-purple-100 text-purple-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    VERIFIED: { label: 'Verified', variant: 'green' },
    PENDING:  { label: 'Pending',  variant: 'amber' },
    REJECTED: { label: 'Rejected', variant: 'red' },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <Badge variant={plan === 'PRO' ? 'purple' : 'default'}>
      {plan}
    </Badge>
  );
}

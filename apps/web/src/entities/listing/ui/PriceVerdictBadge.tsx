import type { PriceVerdict } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

const labels: Record<Exclude<PriceVerdict, 'unknown'>, string> = {
  low: 'Выгодно',
  fair: 'Рыночная',
  high: 'Выше рынка',
};

const tone: Record<Exclude<PriceVerdict, 'unknown'>, string> = {
  low: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
  fair: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  high: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
};

export function PriceVerdictBadge({
  verdict,
  className,
}: {
  verdict?: PriceVerdict | null;
  className?: string;
}) {
  if (!verdict || verdict === 'unknown') return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
        tone[verdict],
        className,
      )}
    >
      {labels[verdict]}
    </span>
  );
}

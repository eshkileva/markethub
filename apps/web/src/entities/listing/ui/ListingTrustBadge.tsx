import { cn } from '@/shared/lib/cn';
import type { AiRiskLevel } from '@markethub/shared';

const toneStyles = {
  high: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
  medium: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  low: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
} as const;

export function ListingTrustBadge({
  score,
  riskLevel,
  className,
}: {
  score?: number | null;
  riskLevel?: AiRiskLevel | string | null;
  className?: string;
}) {
  if (score == null) return null;

  const level: AiRiskLevel =
    riskLevel === 'high' || riskLevel === 'medium' || riskLevel === 'low'
      ? riskLevel
      : score >= 65
        ? 'low'
        : score >= 40
          ? 'medium'
          : 'high';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        toneStyles[level],
        className,
      )}
    >
      Trust {score}
    </span>
  );
}

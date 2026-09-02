import { countryName } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

export function CountryBadge({
  country,
  city,
  className,
}: {
  country: string;
  city?: string | null;
  className?: string;
}) {
  const label = [city, countryName(country)].filter(Boolean).join(', ');
  return (
    <span
      className={cn(
        'text-muted inline-flex min-w-0 max-w-full items-center gap-1 text-xs tabular-nums',
        className,
      )}
    >
      <span className="bg-primary/15 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
        {country}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

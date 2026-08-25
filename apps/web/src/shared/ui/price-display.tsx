import { formatMoney, type ConvertedAmounts, type CurrencyCode } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

const ORDER: CurrencyCode[] = ['BYN', 'RUB', 'KZT'];

export function PriceDisplay({
  price,
  currency,
  converted,
  preferred,
  size = 'md',
  className,
}: {
  price: number;
  currency: CurrencyCode;
  converted?: ConvertedAmounts;
  preferred: CurrencyCode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const amounts = converted ?? {
    RUB: currency === 'RUB' ? Math.round(price) : 0,
    BYN: currency === 'BYN' ? Math.round(price) : 0,
    KZT: currency === 'KZT' ? Math.round(price) : 0,
    [currency]: Math.round(price),
  };
  const primary = amounts[preferred] || Math.round(price);
  const rest = ORDER.filter((code) => code !== preferred && (amounts[code] ?? 0) > 0);

  return (
    <div className={cn('min-w-0', className)}>
      <div
        className={cn(
          'font-semibold tabular-nums tracking-tight',
          size === 'sm' && 'text-base',
          size === 'md' && 'text-lg',
          size === 'lg' && 'font-display text-3xl',
        )}
      >
        {formatMoney(preferred === currency ? price : primary, preferred)}
      </div>
      {rest.length > 0 ? (
        <div
          className={cn(
            'text-muted mt-0.5 truncate tabular-nums',
            size === 'lg' ? 'text-sm' : 'text-xs',
          )}
        >
          ≈ {rest.map((code) => formatMoney(amounts[code], code)).join(' · ')}
        </div>
      ) : null}
    </div>
  );
}

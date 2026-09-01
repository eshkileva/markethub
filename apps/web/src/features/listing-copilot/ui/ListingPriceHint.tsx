import { priceVerdict, type CurrencyCode, type ListingPriceInsight } from '@markethub/shared';
import { cn } from '@/shared/lib/cn';

const verdictLabels = {
  low: 'ниже рынка',
  fair: 'рыночная',
  high: 'выше рынка',
  unknown: null,
} as const;

type PriceStats = {
  min: number | null;
  max: number | null;
  median: number | null;
  sampleSize: number;
  currency: CurrencyCode | string;
};

function formatRange(stats: PriceStats) {
  if (stats.sampleSize <= 0 || stats.min == null || stats.max == null) return null;
  const fmt = (value: number) => value.toLocaleString('ru-RU');
  return `${fmt(stats.min)}–${fmt(stats.max)} ${stats.currency}`;
}

export function ListingPriceHint({
  price,
  insight,
  className,
}: {
  price: string;
  insight?: ListingPriceInsight | PriceStats | null;
  className?: string;
}) {
  if (!insight || insight.sampleSize <= 0) {
    return (
      <p className={cn('text-muted text-sm', className)}>
        Пока мало похожих объявлений — ориентируйтесь на состояние и комплект.
      </p>
    );
  }

  const numericPrice = Number(price);
  const range = formatRange(insight);
  const verdict =
    numericPrice > 0
      ? priceVerdict(numericPrice, insight)
      : ('unknown' as const);
  const verdictLabel = verdictLabels[verdict];

  return (
    <div className={cn('space-y-1 text-sm', className)}>
      {range ? (
        <p className="text-muted">
          Похожие объявления: <span className="text-foreground font-medium">{range}</span>
          {insight.median != null ? (
            <>
              {' '}
              · медиана{' '}
              <span className="text-foreground font-medium">
                {insight.median.toLocaleString('ru-RU')} {insight.currency}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      {numericPrice > 0 && verdictLabel ? (
        <p
          className={cn(
            verdict === 'low' && 'text-amber-700 dark:text-amber-300',
            verdict === 'fair' && 'text-emerald-700 dark:text-emerald-300',
            verdict === 'high' && 'text-muted',
          )}
        >
          Ваша цена {numericPrice.toLocaleString('ru-RU')} {insight.currency} — {verdictLabel}
          {verdict === 'low' ? '. Слишком низкая цена может отпугнуть покупателей или вызвать вопросы.' : ''}
        </p>
      ) : insight.median != null ? (
        <p className="text-muted">
          Частая цена в категории: {insight.median.toLocaleString('ru-RU')} {insight.currency}
        </p>
      ) : null}
    </div>
  );
}

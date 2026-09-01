import type { ListingAiAssessment, ListingCopilotResponse } from '@markethub/shared';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const riskLabels = {
  low: 'Низкий риск',
  medium: 'Средний риск',
  high: 'Высокий риск',
} as const;

const priceLabels = {
  low: 'Ниже рынка',
  fair: 'Рыночная',
  high: 'Выше рынка',
  unknown: 'Недостаточно данных',
} as const;

export type ListingCopilotResult = Omit<ListingCopilotResponse, 'aiEnabled'>;

export function ListingCopilotPanel({
  assessment,
  suggestedPrice,
  busy,
  onApply,
}: {
  assessment: ListingAiAssessment;
  suggestedPrice: number | null;
  busy?: boolean;
  onApply?: () => void;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Черновик от AI · Trust Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted">
          Текст объявления будет от вашего лица. Ниже — служебная оценка для модерации и
          покупателей, её можно не включать в описание.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <div className="text-muted text-xs">Trust Score объявления</div>
            <div className="text-2xl font-semibold tabular-nums">
              {assessment.listingTrustScore}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <div className="text-muted text-xs">Риск</div>
            <div className="font-medium">{riskLabels[assessment.riskLevel]}</div>
          </div>
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <div className="text-muted text-xs">Цена</div>
            <div className="font-medium">{priceLabels[assessment.price.verdict]}</div>
          </div>
        </div>

        {assessment.price.sampleSize > 0 && assessment.price.median ? (
          <p className="text-muted">
            Похожие объявления: {assessment.price.min?.toLocaleString('ru-RU')}–
            {assessment.price.max?.toLocaleString('ru-RU')} {assessment.price.currency}
            {suggestedPrice
              ? ` · рекомендуем ~${suggestedPrice.toLocaleString('ru-RU')} ${assessment.price.currency}`
              : ''}
          </p>
        ) : (
          <p className="text-muted">Пока мало похожих объявлений для точной оценки цены.</p>
        )}

        {assessment.reasons.length > 0 ? (
          <ul className="text-muted list-disc space-y-1 pl-5">
            {assessment.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}

        {onApply ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={onApply}>
            Применить черновик AI
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

import {
  buyerChecklistForCategory,
  type ListingAiAssessment,
  type PriceVerdict,
} from '@markethub/shared';
import { ListingTrustBadge } from '@/entities/listing/ui/ListingTrustBadge';
import { PriceVerdictBadge } from '@/entities/listing/ui/PriceVerdictBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const verdictHints: Record<Exclude<PriceVerdict, 'unknown'>, string> = {
  low: 'Цена ниже похожих объявлений — проверьте причину и состояние товара.',
  fair: 'Цена близка к рынку в этой категории.',
  high: 'Цена выше большинства похожих объявлений.',
};

export function ListingBuyerBrief({
  categorySlug,
  listingTrustScore,
  aiRiskLevel,
  assessment,
}: {
  categorySlug?: string | null;
  listingTrustScore?: number | null;
  aiRiskLevel?: 'low' | 'medium' | 'high' | null;
  assessment?: ListingAiAssessment | null;
}) {
  const checklist = buyerChecklistForCategory(categorySlug);
  const price = assessment?.price;
  const verdict = price?.verdict;

  if (!assessment && listingTrustScore == null && checklist.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Перед покупкой</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <ListingTrustBadge score={listingTrustScore} riskLevel={aiRiskLevel} />
          <PriceVerdictBadge verdict={verdict} />
        </div>

        {price && price.sampleSize > 0 && price.median != null ? (
          <p className="text-muted">
            Похожие объявления: {price.min?.toLocaleString('ru-RU')}–
            {price.max?.toLocaleString('ru-RU')} {price.currency}
            {price.median
              ? ` · медиана ${price.median.toLocaleString('ru-RU')} ${price.currency}`
              : ''}
          </p>
        ) : null}

        {verdict && verdict !== 'unknown' ? (
          <p className="text-foreground">{verdictHints[verdict]}</p>
        ) : null}

        {checklist.length > 0 ? (
          <div>
            <p className="mb-2 font-medium">Что проверить</p>
            <ul className="text-muted list-disc space-y-1 pl-5">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

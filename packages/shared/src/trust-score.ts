import type { CurrencyCode } from './geo/currencies.js';

export function trustScoreFromReviews(average: number | null, count: number): number {
  if (count <= 0 || average == null || Number.isNaN(average)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(average * 20)));
}

export const AI_RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type AiRiskLevel = (typeof AI_RISK_LEVELS)[number];

export const PRICE_VERDICTS = ['low', 'fair', 'high', 'unknown'] as const;
export type PriceVerdict = (typeof PRICE_VERDICTS)[number];

export type ListingPriceInsight = {
  min: number | null;
  max: number | null;
  median: number | null;
  sampleSize: number;
  verdict: PriceVerdict;
  currency: CurrencyCode;
};

export type ListingAiAssessment = {
  riskScore: number;
  riskLevel: AiRiskLevel;
  /** Risk before price-market adjustments; used to recalculate when price changes. */
  baseRiskScore: number;
  reasons: string[];
  sellerTrustScore: number;
  listingTrustScore: number;
  price: ListingPriceInsight;
  model: string;
  assessedAt: string;
};

export function buildListingAssessment(input: {
  baseRiskScore: number;
  sellerTrustScore: number;
  price: number | null | undefined;
  stats: { min: number | null; max: number | null; median: number | null; sampleSize: number };
  currency: CurrencyCode;
  reasons: string[];
  model: string;
  assessedAt?: string;
}): ListingAiAssessment {
  const verdict =
    input.price != null && input.price > 0
      ? priceVerdict(input.price, input.stats)
      : priceVerdict(0, input.stats);
  const riskScore = mergeRiskScore(input.baseRiskScore, verdict);
  return {
    riskScore,
    riskLevel: aiRiskLevelFromScore(riskScore),
    baseRiskScore: input.baseRiskScore,
    reasons: input.reasons.slice(0, 8),
    sellerTrustScore: input.sellerTrustScore,
    listingTrustScore: listingTrustScore(input.sellerTrustScore, riskScore),
    price: {
      min: input.stats.min,
      max: input.stats.max,
      median: input.stats.median,
      sampleSize: input.stats.sampleSize,
      verdict,
      currency: input.currency,
    },
    model: input.model,
    assessedAt: input.assessedAt ?? new Date().toISOString(),
  };
}

export function aiRiskLevelFromScore(score: number): AiRiskLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function listingTrustScore(sellerTrustScore: number, riskScore: number): number {
  // No reviews stored as 0 — that is "unknown", not "untrusted".
  const seller = sellerTrustScore > 0 ? Math.min(100, sellerTrustScore) : 50;
  const clampedRisk = Math.min(100, Math.max(0, riskScore));
  const sellerPart = seller * 0.3;
  const listingPart = (100 - clampedRisk) * 0.7;
  return Math.round(sellerPart + listingPart);
}

export function listingTrustScoreFromAssessment(
  assessment: { riskScore?: unknown; sellerTrustScore?: unknown } | null | undefined,
  stored?: number | null,
): number | null {
  if (
    !assessment ||
    typeof assessment.riskScore !== 'number' ||
    Number.isNaN(assessment.riskScore)
  ) {
    return stored ?? null;
  }
  const seller =
    typeof assessment.sellerTrustScore === 'number' && !Number.isNaN(assessment.sellerTrustScore)
      ? assessment.sellerTrustScore
      : 0;
  return listingTrustScore(seller, assessment.riskScore);
}

export function priceVerdict(
  price: number,
  stats: { min: number | null; max: number | null; median: number | null; sampleSize: number },
): PriceVerdict {
  if (stats.sampleSize < 3 || stats.median == null) {
    return 'unknown';
  }
  if (price < stats.median * 0.7) return 'low';
  if (price > stats.median * 1.35) return 'high';
  return 'fair';
}

export function mergeRiskScore(aiRisk: number, priceVerdictValue: PriceVerdict): number {
  let score = Math.min(100, Math.max(0, Math.round(aiRisk)));
  if (priceVerdictValue === 'low') score = Math.min(100, score + 25);
  if (priceVerdictValue === 'high') score = Math.min(100, score + 10);
  return score;
}

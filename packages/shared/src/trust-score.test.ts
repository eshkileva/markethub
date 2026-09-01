import { describe, expect, it } from 'vitest';
import {
  aiRiskLevelFromScore,
  buildListingAssessment,
  listingTrustScore,
  mergeRiskScore,
  priceVerdict,
  trustScoreFromReviews,
} from './trust-score.js';

describe('trustScoreFromReviews', () => {
  it('is 0 when there are no reviews', () => {
    expect(trustScoreFromReviews(null, 0)).toBe(0);
    expect(trustScoreFromReviews(5, 0)).toBe(0);
  });

  it('maps 1–5 stars onto 0–100', () => {
    expect(trustScoreFromReviews(1, 1)).toBe(20);
    expect(trustScoreFromReviews(4, 3)).toBe(80);
    expect(trustScoreFromReviews(5, 2)).toBe(100);
  });
});

describe('listingTrustScore', () => {
  it('combines seller trust and listing risk', () => {
    expect(listingTrustScore(80, 20)).toBe(80);
    expect(listingTrustScore(0, 100)).toBe(0);
  });
});

describe('priceVerdict', () => {
  it('flags suspiciously low prices', () => {
    expect(priceVerdict(30_000, { min: 40_000, max: 60_000, median: 50_000, sampleSize: 5 })).toBe(
      'low',
    );
  });
});

describe('mergeRiskScore', () => {
  it('increases risk for low market price', () => {
    expect(mergeRiskScore(20, 'low')).toBe(45);
    expect(aiRiskLevelFromScore(45)).toBe('medium');
  });
});

describe('buildListingAssessment', () => {
  it('recomputes trust score when price changes', () => {
    const stats = { min: 40_000, max: 60_000, median: 50_000, sampleSize: 8 };
    const fair = buildListingAssessment({
      baseRiskScore: 20,
      sellerTrustScore: 60,
      price: 48_000,
      stats,
      currency: 'RUB',
      reasons: ['ok'],
      model: 'test/model',
    });
    const low = buildListingAssessment({
      baseRiskScore: 20,
      sellerTrustScore: 60,
      price: 1_000,
      stats,
      currency: 'RUB',
      reasons: ['ok'],
      model: 'test/model',
    });

    expect(fair.price.verdict).toBe('fair');
    expect(low.price.verdict).toBe('low');
    expect(low.listingTrustScore).toBeLessThan(fair.listingTrustScore);
  });
});

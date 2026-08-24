import { describe, expect, it } from 'vitest';
import { trustScoreFromReviews } from './trust-score.js';

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

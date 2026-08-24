export function trustScoreFromReviews(average: number | null, count: number): number {
  if (count <= 0 || average == null || Number.isNaN(average)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(average * 20)));
}

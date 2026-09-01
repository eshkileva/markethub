import type { AiRiskLevel } from './trust-score.js';

export type PublishRouteInput = {
  aiRiskLevel?: AiRiskLevel | null;
  hasAssessment: boolean;
};

export function resolvePublishStatus(
  input: PublishRouteInput,
): 'published' | 'pending_moderation' {
  if (input.hasAssessment && input.aiRiskLevel === 'low') {
    return 'published';
  }
  return 'pending_moderation';
}

export const MODERATION_RISK_LABELS = {
  low: 'Низкий риск',
  medium: 'Средний риск',
  high: 'Высокий риск',
} as const;

export const MODERATION_RISK_SORT = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

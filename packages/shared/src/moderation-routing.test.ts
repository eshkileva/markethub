import { describe, expect, it } from 'vitest';
import { resolvePublishStatus } from './moderation-routing.js';

describe('resolvePublishStatus', () => {
  it('auto-publishes low-risk listings with assessment', () => {
    expect(resolvePublishStatus({ hasAssessment: true, aiRiskLevel: 'low' })).toBe('published');
  });

  it('queues medium and high risk listings', () => {
    expect(resolvePublishStatus({ hasAssessment: true, aiRiskLevel: 'medium' })).toBe(
      'pending_moderation',
    );
    expect(resolvePublishStatus({ hasAssessment: true, aiRiskLevel: 'high' })).toBe(
      'pending_moderation',
    );
  });

  it('queues listings without AI assessment', () => {
    expect(resolvePublishStatus({ hasAssessment: false, aiRiskLevel: null })).toBe(
      'pending_moderation',
    );
  });
});

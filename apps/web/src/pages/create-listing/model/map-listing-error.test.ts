import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/client';
import { COPILOT_RATE_LIMIT_RETRY, mapCopilotError, mapListingError } from './map-listing-error';

describe('mapCopilotError', () => {
  it('asks the user to retry on provider 429', () => {
    expect(mapCopilotError(new ApiError(429, 'Too Many Requests', 'RATE_LIMIT'))).toBe(
      COPILOT_RATE_LIMIT_RETRY,
    );
    expect(mapListingError('AI provider error: 429 rate limit')).toBe(COPILOT_RATE_LIMIT_RETRY);
  });

  it('keeps the daily quota message', () => {
    const message = 'Достигнут дневной лимит AI-помощника (20). Попробуйте завтра.';
    expect(mapCopilotError(new ApiError(429, message, 'RATE_LIMIT'))).toBe(message);
  });
});

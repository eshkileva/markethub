import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsEvent } from './vercel-analytics';

describe('sanitizeAnalyticsEvent', () => {
  it('drops conversation ids from chat URLs', () => {
    const next = sanitizeAnalyticsEvent({
      type: 'pageview',
      url: 'https://kupilko.store/messages?conversation=abc-123',
    });
    expect(next?.url).toBe('https://kupilko.store/messages');
  });

  it('keeps catalog category query', () => {
    const next = sanitizeAnalyticsEvent({
      type: 'pageview',
      url: 'https://kupilko.store/catalog?category=phones',
    });
    expect(next?.url).toBe('https://kupilko.store/catalog?category=phones');
  });

  it('strips email verification codes', () => {
    const next = sanitizeAnalyticsEvent({
      type: 'pageview',
      url: 'https://kupilko.store/verify-email?code=123456',
    });
    expect(next?.url).toBe('https://kupilko.store/verify-email');
  });
});

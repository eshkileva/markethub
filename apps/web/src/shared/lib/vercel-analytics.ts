import type { BeforeSendEvent } from '@vercel/analytics';

const STRIP_SEARCH = new Set(['conversation', 'code', 'token']);

export function sanitizeAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, 'https://kupilko.store');
    if (url.pathname.startsWith('/messages')) {
      url.pathname = '/messages';
      url.search = '';
    } else if (
      url.pathname === '/verify-email' ||
      url.pathname === '/forgot-password' ||
      url.pathname === '/auth'
    ) {
      url.search = '';
    } else {
      for (const key of STRIP_SEARCH) url.searchParams.delete(key);
    }
    url.hash = '';
    return { ...event, url: `${url.origin}${url.pathname}${url.search}` };
  } catch {
    return event;
  }
}

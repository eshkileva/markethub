import { Analytics } from '@vercel/analytics/react';
import { useRouterState } from '@tanstack/react-router';
import { sanitizeAnalyticsEvent } from '@/shared/lib/vercel-analytics';

export function VercelAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <Analytics path={pathname} route={pathname} beforeSend={sanitizeAnalyticsEvent} />;
}

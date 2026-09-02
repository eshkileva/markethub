import { useEffect, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar';
import { TopBar } from '@/widgets/top-bar/ui/TopBar';
import { AiGlobalStrip } from '@/features/ai/ui/AiGlobalStrip';
import { BottomNav } from '@/widgets/bottom-nav/ui/BottomNav';
import { ToastViewport } from '@/shared/ui/toast-viewport';
import { restoreSession } from '@/shared/api/session';
import { applyTheme, useUiStore } from '@/shared/model/stores';
import { cn } from '@/shared/lib/cn';
import { isRobotsDisallowPath, SITE_NAME } from '@markethub/shared';
import { SeoHead } from '@/shared/lib/seo-head';
import { SiteFooter } from '@/widgets/site-footer/ui/SiteFooter';
import { VercelAnalytics } from '@/widgets/vercel-analytics/ui/VercelAnalytics';

export function AppShell() {
  const [sessionReady, setSessionReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthFlow =
    pathname === '/auth' || pathname === '/verify-email' || pathname === '/forgot-password';
  const isChat = pathname === '/messages';
  const isListingForm =
    pathname === '/listings/create' || /^\/listings\/[^/]+\/edit$/.test(pathname);
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    void restoreSession().finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  if (!sessionReady) {
    return (
      <>
        <VercelAnalytics />
        <div className="bg-background h-dvh" />
      </>
    );
  }

  if (isAuthFlow) {
    return (
      <div className="bg-background h-dvh overflow-y-auto">
        <VercelAnalytics />
        <SeoHead noindex title={`Вход — ${SITE_NAME}`} />
        <Outlet />
        <div className="mx-auto max-w-md px-4 pb-8">
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-dvh max-w-full overflow-hidden">
      <VercelAnalytics />
      <SeoHead noindex={isRobotsDisallowPath(pathname) || isListingForm} title={SITE_NAME} />
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        <TopBar />
        {!isChat ? <AiGlobalStrip /> : null}
        <main
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-x-hidden',
            isChat
              ? 'overflow-hidden p-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0'
              : isListingForm
                ? 'overflow-y-auto px-3 py-4 pb-6 sm:px-4 lg:px-6 lg:py-6'
                : 'overflow-y-auto px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 lg:px-6 lg:py-6 lg:pb-6',
          )}
        >
          <div className={cn(isChat ? 'h-full min-w-0' : 'mx-auto w-full min-w-0 max-w-7xl')}>
            <Outlet />
            {!isChat ? <SiteFooter /> : null}
          </div>
        </main>
      </div>
      {!isListingForm ? <BottomNav /> : null}
      <ToastViewport />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar';
import { TopBar } from '@/widgets/top-bar/ui/TopBar';
import { AiGlobalStrip } from '@/features/ai/ui/AiGlobalStrip';
import { BottomNav } from '@/widgets/bottom-nav/ui/BottomNav';
import { restoreSession } from '@/shared/api/session';
import { applyTheme, useUiStore } from '@/shared/model/stores';
import { cn } from '@/shared/lib/cn';

export function AppShell() {
  const [sessionReady, setSessionReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthFlow = pathname === '/auth' || pathname === '/verify-email';
  const isChat = pathname === '/messages';
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
    return <div className="bg-background h-dvh" />;
  }

  if (isAuthFlow) {
    return (
      <div className="bg-background h-dvh overflow-y-auto">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        {!isChat ? <AiGlobalStrip /> : null}
        <main
          className={cn(
            'min-h-0 flex-1',
            isChat
              ? 'overflow-hidden p-0 pb-16 lg:pb-0'
              : 'overflow-y-auto px-4 py-6 pb-24 lg:px-6 lg:pb-6',
          )}
        >
          <div className={cn(isChat ? 'h-full' : 'mx-auto w-full max-w-7xl')}>
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

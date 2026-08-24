import { useEffect, useState } from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { AppSidebar } from '@/widgets/app-sidebar/ui/AppSidebar';
import { TopBar } from '@/widgets/top-bar/ui/TopBar';
import { restoreSession } from '@/shared/api/session';
import { cn } from '@/shared/lib/cn';

export function AppShell() {
  const [sessionReady, setSessionReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuth = pathname === '/auth';
  const isChat = pathname === '/messages';

  useEffect(() => {
    void restoreSession().finally(() => setSessionReady(true));
  }, []);

  if (!sessionReady) {
    return <div className="bg-background h-dvh" />;
  }

  if (isAuth) {
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
        <main
          className={cn(
            'min-h-0 flex-1',
            isChat ? 'overflow-hidden p-0' : 'overflow-y-auto px-4 py-6 lg:px-6',
          )}
        >
          <div className={cn(isChat ? 'h-full' : 'mx-auto w-full max-w-7xl')}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { AppShell } from '@/widgets/app-shell/ui/AppShell';
import { ErrorPage } from '@/pages/common/ui/ErrorPage';
import { NotFoundPage } from '@/pages/common/ui/NotFoundPage';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
});

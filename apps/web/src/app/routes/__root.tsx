import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { AppShell } from '@/widgets/app-shell/ui/AppShell';
import { ErrorPage } from '@/pages/common/ui/ErrorPage';
import { NotFoundPage } from '@/pages/common/ui/NotFoundPage';
import { guardRoute } from '@/app/guards/route-auth';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => guardRoute(location.pathname),
  component: AppShell,
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
});

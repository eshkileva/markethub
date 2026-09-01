import { useEffect } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Heart,
  Home,
  LayoutGrid,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { useUnreadNotifications } from '@/features/notifications/model/use-unread-count';
import { useUnreadMessages } from '@/features/messaging/model/use-unread-count';
import { BrandMark } from '@/shared/ui/brand-mark';
import { categoryIcons } from '@/entities/category/model/icons';
import { categoryRoots } from '@/entities/category/model/tree';
import { AiPlatformBadge } from '@/features/ai/ui/AiPlatformBadge';
import { AI_PLATFORM_TAGLINE } from '@/features/ai/model/ai-messaging';
import { useAiStatus } from '@/features/ai/model/use-ai-status';

const mainNav = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/catalog', label: 'Каталог', icon: LayoutGrid },
  { to: '/favorites', label: 'Избранное', icon: Heart },
  { to: '/messages', label: 'Сообщения', icon: MessageSquare },
  { to: '/my-listings', label: 'Мои объявления', icon: Package },
  { to: '/purchases', label: 'Покупки', icon: ShoppingBag },
  { to: '/sales', label: 'Продажи', icon: Package },
  { to: '/notifications', label: 'Уведомления', icon: Bell },
  { to: '/settings', label: 'Настройки', icon: Settings },
] as const;

type CategoriesResponse = {
  items: Array<{ id: string; slug: string; nameRu: string; parentId: string | null }>;
};

function NavCount({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        active ? 'bg-white/20 text-white' : 'bg-primary text-white',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = useRouterState({ select: (s) => s.location.href });
  const search = useRouterState({ select: (s) => s.location.search });
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const role = useAuthStore((s) => s.user?.role);
  const isModerator = role === 'moderator' || role === 'admin';
  const unread = useUnreadNotifications();
  const unreadCount = unread.data?.count ?? 0;
  const unreadMessages = useUnreadMessages();
  const unreadMessageCount = unreadMessages.data?.count ?? 0;
  const aiStatus = useAiStatus();

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<CategoriesResponse>('/v1/categories'),
  });

  useEffect(() => {
    setSidebarOpen(false);
  }, [href, setSidebarOpen]);

  const activeCategory =
    pathname === '/catalog' && typeof search === 'object' && search && 'category' in search
      ? String((search as { category?: string }).category ?? '')
      : '';

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть меню"
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col',
          'h-dvh transition-transform duration-200 ease-out',
          'lg:static lg:z-auto lg:h-full lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 py-5">
          <BrandMark />
          <p className="text-sidebar-muted mt-2 text-xs leading-relaxed">{AI_PLATFORM_TAGLINE}</p>
          <AiPlatformBadge live={aiStatus.data?.enabled} size="sm" className="mt-2" />
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const active =
                item.to === '/'
                  ? pathname === '/'
                  : item.to === '/catalog'
                    ? pathname.startsWith('/catalog')
                    : pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200',
                    active
                      ? 'bg-primary text-white'
                      : 'text-sidebar-muted hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.to === '/notifications' ? (
                    <NavCount count={unreadCount} active={active} />
                  ) : null}
                  {item.to === '/messages' ? (
                    <NavCount count={unreadMessageCount} active={active} />
                  ) : null}
                </Link>
              );
            })}
            {isModerator ? (
              <Link
                to="/moderation"
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200',
                  pathname === '/moderation'
                    ? 'bg-primary text-white'
                    : 'text-sidebar-muted hover:bg-white/5 hover:text-white',
                )}
              >
                <Shield className="h-4 w-4" />
                Модерация
              </Link>
            ) : null}
          </div>

          <div>
            <div className="text-sidebar-muted mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
              Категории
            </div>
            <div className="space-y-1">
              {(categoryRoots(categoriesQuery.data?.items ?? [])).map((item) => {
                const Icon = categoryIcons[item.slug] ?? Package;
                const active = activeCategory === item.slug;
                return (
                  <Link
                    key={item.id}
                    to="/catalog"
                    search={{ category: item.slug }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200',
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-sidebar-muted hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.nameRu}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

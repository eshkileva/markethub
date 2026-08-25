import { Link, useRouterState } from '@tanstack/react-router';
import { Home, LayoutGrid, MessageSquare, Plus, User } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useAuthStore } from '@/shared/model/stores';
import { useUnreadMessages } from '@/features/messaging/model/use-unread-count';

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadMessages().data?.count ?? 0;

  const itemClass = (active: boolean) =>
    cn(
      'relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
      active ? 'text-primary' : 'text-muted',
    );

  return (
    <nav
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:hidden"
      aria-label="Нижняя навигация"
    >
      <div className="grid grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)] pt-2">
        <Link to="/" className={itemClass(pathname === '/')}>
          <Home className="h-5 w-5" />
          Главная
        </Link>
        <Link to="/catalog" className={itemClass(pathname.startsWith('/catalog'))}>
          <LayoutGrid className="h-5 w-5" />
          Каталог
        </Link>
        <Link
          to="/listings/create"
          className="flex flex-col items-center justify-center py-1"
          aria-label="Разместить объявление"
        >
          <span className="bg-accent text-accent-foreground -mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-md">
            <Plus className="h-5 w-5" />
          </span>
        </Link>
        <Link to="/messages" className={itemClass(pathname.startsWith('/messages'))}>
          <MessageSquare className="h-5 w-5" />
          Чаты
          {unread > 0 ? (
            <span className="bg-primary absolute right-4 top-1.5 h-1.5 w-1.5 rounded-full" />
          ) : null}
        </Link>
        {user ? (
          <Link
            to="/profile/$username"
            params={{ username: user.username }}
            className={itemClass(pathname.startsWith('/profile') || pathname === '/settings')}
          >
            <User className="h-5 w-5" />
            Профиль
          </Link>
        ) : (
          <Link to="/auth" className={itemClass(pathname === '/auth')}>
            <User className="h-5 w-5" />
            Войти
          </Link>
        )}
      </div>
    </nav>
  );
}

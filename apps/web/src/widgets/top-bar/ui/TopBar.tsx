import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Bell, MapPin, Menu, Plus, Search } from 'lucide-react';
import { COUNTRIES, type CountryCode } from '@markethub/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { useUnreadNotifications } from '@/features/notifications/model/use-unread-count';

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadNotifications();
  const unreadCount = unread.data?.count ?? 0;
  const countryFilter = useUiStore((s) => s.countryFilter);
  const setCountryFilter = useUiStore((s) => s.setCountryFilter);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <header className="border-border bg-card/90 z-20 shrink-0 border-b backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Открыть меню"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <form
          className="relative min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({
              to: '/catalog',
              search: { q: query.trim() || undefined },
            });
          }}
        >
          <Search className="text-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            className="border-border bg-background h-11 rounded-2xl pl-10"
            placeholder="Поиск по объявлениям СНГ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="border-border bg-background hidden items-center gap-2 rounded-2xl border px-3 py-2 md:flex">
          <MapPin className="text-primary h-4 w-4" />
          <select
            className="bg-transparent text-sm outline-none"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value as CountryCode | 'ALL')}
            aria-label="Страна"
          >
            <option value="ALL">Весь СНГ</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.nameRu}
              </option>
            ))}
          </select>
        </div>

        <Button asChild className="hidden sm:inline-flex">
          <Link to="/listings/create">
            <Plus className="h-4 w-4" />
            Разместить
          </Link>
        </Button>

        <Button variant="ghost" size="icon" aria-label="Уведомления" asChild className="relative">
          <Link to="/notifications">
            <Bell className="text-muted h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="bg-primary absolute right-1.5 top-1.5 h-2 w-2 rounded-full" />
            ) : null}
          </Link>
        </Button>

        {user ? (
          <Link to="/profile/$username" params={{ username: user.username }}>
            <Avatar>
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback>
                {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Button variant="secondary" asChild>
            <Link to="/auth">Войти</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

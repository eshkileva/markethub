import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Bell, MapPin, Menu, Plus } from 'lucide-react';
import { COUNTRIES, CURRENCIES, type CountryCode, type CurrencyCode } from '@markethub/shared';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { useAuthStore, useUiStore } from '@/shared/model/stores';
import { useUnreadNotifications } from '@/features/notifications/model/use-unread-count';
import { Combobox } from '@/shared/ui/combobox';
import { ThemeSwitch } from '@/widgets/top-bar/ui/ThemeSwitch';
import { SearchBox } from '@/widgets/top-bar/ui/SearchBox';
import { AiPlatformBadge } from '@/features/ai/ui/AiPlatformBadge';
import { useAiStatus } from '@/features/ai/model/use-ai-status';
import { resolveSmartSearch } from '@/features/search/model/resolve-smart-search';

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadNotifications();
  const unreadCount = unread.data?.count ?? 0;
  const countryFilter = useUiStore((s) => s.countryFilter);
  const setCountryFilter = useUiStore((s) => s.setCountryFilter);
  const displayCurrency = useUiStore((s) => s.displayCurrency);
  const setDisplayCurrency = useUiStore((s) => s.setDisplayCurrency);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const token = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const aiStatus = useAiStatus();

  function submitSearch(queryOverride?: string) {
    const term = (queryOverride ?? query).trim();
    if (!term) {
      void navigate({ to: '/catalog' });
      return;
    }
    void resolveSmartSearch(
      term,
      { country: countryFilter === 'ALL' ? undefined : countryFilter },
      token,
    ).then((search) => navigate({ to: '/catalog', search }));
  }

  const geoControls = (
    <div className="border-border bg-background flex h-10 shrink-0 items-center rounded-xl border px-1.5 lg:h-auto lg:rounded-2xl lg:px-3 lg:py-2">
      <MapPin className="text-primary hidden h-4 w-4 shrink-0 lg:mr-1 lg:block" />
      <Combobox
        className="w-[3.5rem] lg:w-[4.5rem]"
        size="sm"
        variant="ghost"
        value={countryFilter}
        onChange={(next) => setCountryFilter(next as CountryCode | 'ALL')}
        aria-label="Страна"
        options={[
          { value: 'ALL', label: 'СНГ' },
          ...COUNTRIES.map((country) => ({
            value: country.code,
            label: country.code,
          })),
        ]}
      />
      <span className="text-border hidden lg:inline">·</span>
      <Combobox
        className="w-[3.5rem] lg:w-[4.75rem]"
        size="sm"
        variant="ghost"
        value={displayCurrency}
        onChange={(next) => setDisplayCurrency(next as CurrencyCode)}
        aria-label="Валюта отображения"
        options={CURRENCIES.map((item) => ({
          value: item.code,
          label: item.code,
        }))}
      />
    </div>
  );

  return (
    <header className="border-border bg-card/90 z-20 shrink-0 border-b backdrop-blur">
      <div className="flex flex-col gap-2 px-3 py-2 lg:px-6 lg:py-3">
        <div className="flex h-10 items-center gap-2 lg:h-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 lg:hidden"
            aria-label="Открыть меню"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="AI-поиск: iPhone до 50000..."
            className="hidden min-w-0 flex-1 lg:block"
            onSubmit={submitSearch}
          />

          <AiPlatformBadge
            live={aiStatus.data?.enabled}
            size="sm"
            className="hidden md:inline-flex"
          />

          <div className="ml-auto flex min-w-0 items-center gap-2 lg:ml-0">
            {geoControls}
            <ThemeSwitch className="hidden lg:flex" />
            <Button asChild variant="accent" className="hidden lg:inline-flex">
              <Link to="/listings/create">
                <Plus className="h-4 w-4" />
                Разместить
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Уведомления"
              asChild
              className="relative h-10 w-10 shrink-0"
            >
              <Link to="/notifications">
                <Bell className="text-muted h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="bg-primary absolute right-1.5 top-1.5 h-2 w-2 rounded-full" />
                ) : null}
              </Link>
            </Button>
            {user ? (
              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                className="hidden shrink-0 lg:block"
              >
                <Avatar className="h-9 w-9">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>
                    {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Button variant="secondary" asChild className="hidden shrink-0 lg:inline-flex">
                <Link to="/auth">Войти</Link>
              </Button>
            )}
          </div>
        </div>

        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Найти на Купилко..."
          className="lg:hidden"
          inputClassName="h-10 rounded-xl"
          onSubmit={submitSearch}
        />
      </div>
    </header>
  );
}

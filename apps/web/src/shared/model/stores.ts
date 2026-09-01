import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, CountryCode, CurrencyCode } from '@markethub/shared';
import { AUTH_STORAGE_KEY } from '@/shared/constants/auth';

export type { AuthUser };

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  expiresAt: number | null;
  setSession: (accessToken: string, user: AuthUser, expiresInSeconds?: number) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      expiresAt: null,
      setSession: (accessToken, user, expiresInSeconds = DEFAULT_ACCESS_TOKEN_TTL_SECONDS) =>
        set({
          accessToken,
          user,
          expiresAt: Date.now() + expiresInSeconds * 1000,
        }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, user: null, expiresAt: null }),
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);

export type ThemeMode = 'light' | 'dark' | 'system';

type UiState = {
  sidebarOpen: boolean;
  filtersOpen: boolean;
  countryFilter: CountryCode | 'ALL';
  displayCurrency: CurrencyCode;
  theme: ThemeMode;
  setSidebarOpen: (open: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  setCountryFilter: (country: CountryCode | 'ALL') => void;
  setDisplayCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      filtersOpen: false,
      countryFilter: 'ALL',
      displayCurrency: 'RUB',
      theme: 'system',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
      setCountryFilter: (countryFilter) => set({ countryFilter }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'kupilko-ui',
      partialize: (state) => ({
        countryFilter: state.countryFilter,
        displayCurrency: state.displayCurrency,
        theme: state.theme,
      }),
    },
  ),
);

export function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}

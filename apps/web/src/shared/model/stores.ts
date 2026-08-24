import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CountryCode } from '@markethub/shared';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  country: string;
  city: string | null;
  trustScore: number;
  isVerified: boolean;
  role: string;
};

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
    { name: 'markethub-auth' },
  ),
);

type UiState = {
  sidebarOpen: boolean;
  countryFilter: CountryCode | 'ALL';
  setSidebarOpen: (open: boolean) => void;
  setCountryFilter: (country: CountryCode | 'ALL') => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  countryFilter: 'ALL',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCountryFilter: (countryFilter) => set({ countryFilter }),
}));

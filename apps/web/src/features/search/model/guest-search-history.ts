import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_SEARCH_HISTORY, normalizeSearchQuery, searchQueryKey } from '@markethub/shared';

export type GuestSearchHistoryItem = {
  id: string;
  query: string;
  createdAt: number;
};

type GuestSearchHistoryState = {
  items: GuestSearchHistoryItem[];
  record: (rawQuery: string) => GuestSearchHistoryItem | null;
  remove: (id: string) => void;
  clear: () => void;
};

function nextGuestItem(query: string): GuestSearchHistoryItem {
  return {
    id: crypto.randomUUID(),
    query,
    createdAt: Date.now(),
  };
}

export const useGuestSearchHistoryStore = create<GuestSearchHistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      record: (rawQuery) => {
        const query = normalizeSearchQuery(rawQuery);
        if (!query) return null;
        const key = searchQueryKey(query);
        const withoutDuplicate = get().items.filter((item) => searchQueryKey(item.query) !== key);
        const item = nextGuestItem(query);
        set({
          items: [item, ...withoutDuplicate].slice(0, MAX_SEARCH_HISTORY),
        });
        return item;
      },
      remove: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'kupilko-search-history' },
  ),
);

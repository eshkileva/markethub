import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeSearchQuery } from '@markethub/shared';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { useGuestSearchHistoryStore } from '@/features/search/model/guest-search-history';

export type SearchHistoryItem = {
  id: string;
  query: string;
  createdAt: string | number;
};

type HistoryResponse = {
  items: Array<{ id: string; query: string; createdAt: string }>;
};

export function useSearchHistory() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const guestItems = useGuestSearchHistoryStore((s) => s.items);
  const guestRecord = useGuestSearchHistoryStore((s) => s.record);
  const guestRemove = useGuestSearchHistoryStore((s) => s.remove);
  const guestClear = useGuestSearchHistoryStore((s) => s.clear);

  const historyQuery = useQuery({
    queryKey: ['search-history'],
    enabled: Boolean(token),
    queryFn: () => apiRequest<HistoryResponse>('/v1/search/history', { token }),
  });

  const recordMutation = useMutation({
    mutationFn: (query: string) =>
      apiRequest<{ item: SearchHistoryItem }>('/v1/search/history', {
        method: 'POST',
        token,
        body: { query },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/v1/search/history/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest<void>('/v1/search/history', { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['search-history'] }),
  });

  const items: SearchHistoryItem[] = token
    ? (historyQuery.data?.items ?? [])
    : guestItems.map((item) => ({
        id: item.id,
        query: item.query,
        createdAt: item.createdAt,
      }));

  function record(rawQuery: string) {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) return;
    if (token) {
      recordMutation.mutate(query);
      return;
    }
    guestRecord(query);
  }

  function remove(id: string) {
    if (token) {
      removeMutation.mutate(id);
      return;
    }
    guestRemove(id);
  }

  function clear() {
    if (token) {
      clearMutation.mutate();
      return;
    }
    guestClear();
  }

  return {
    items,
    isLoading: Boolean(token) && historyQuery.isLoading,
    record,
    remove,
    clear,
  };
}

export function recordSearchQuery(rawQuery: string, record: (query: string) => void) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return;
  record(query);
}

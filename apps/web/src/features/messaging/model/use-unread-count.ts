import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';

type UnreadResponse = { count: number };

export function useUnreadMessages() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['conversations', 'unread', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<UnreadResponse>('/v1/conversations/unread-count', { token }),
    refetchInterval: 30_000,
  });
}

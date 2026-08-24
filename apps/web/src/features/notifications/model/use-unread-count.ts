import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';

type UnreadResponse = { count: number };

export function useUnreadNotifications() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['notifications', 'unread', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<UnreadResponse>('/v1/notifications/unread-count', { token }),
    refetchInterval: 30_000,
  });
}

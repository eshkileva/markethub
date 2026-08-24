import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';

export function useFavoriteToggle() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ listingId, next }: { listingId: string; next: boolean }) => {
      if (!token) {
        await navigate({ to: '/auth' });
        throw new Error('AUTH_REQUIRED');
      }
      if (next) {
        await apiRequest('/v1/favorites', {
          method: 'POST',
          token,
          body: { listingId },
        });
      } else {
        await apiRequest(`/v1/favorites/${listingId}`, {
          method: 'DELETE',
          token,
        });
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['listing'] }),
      ]);
    },
  });
}

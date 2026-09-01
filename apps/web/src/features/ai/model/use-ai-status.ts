import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';

type AiStatus = {
  enabled: boolean;
  model: string | null;
};

export function useAiStatus() {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => apiRequest<AiStatus>('/v1/ai/status'),
    staleTime: 60_000,
  });
}

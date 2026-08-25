import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';

export function mapDealError(message: string) {
  if (
    message === 'Only published listings can be reserved' ||
    message === 'Забронировать можно только опубликованное объявление'
  ) {
    return 'Забронировать можно только опубликованное объявление';
  }
  if (
    message === 'Only active listings can be marked as sold' ||
    message === 'Продать можно только активное объявление'
  ) {
    return 'Продать можно только активное объявление';
  }
  if (
    message === 'Only reserved or sold listings can be relisted' ||
    message === 'Вернуть в продажу можно только забронированное или проданное объявление'
  ) {
    return 'Вернуть в продажу можно только забронированное или проданное объявление';
  }
  return message;
}

export function useListingDeal() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['listings'] }),
      queryClient.invalidateQueries({ queryKey: ['listing'] }),
    ]);
  };

  const reserve = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/v1/listings/${id}/reserve`, { method: 'POST', token, body: {} }),
    onSuccess: invalidate,
  });

  const sell = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/v1/listings/${id}/sell`, { method: 'POST', token, body: {} }),
    onSuccess: invalidate,
  });

  const relist = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/v1/listings/${id}/relist`, { method: 'POST', token, body: {} }),
    onSuccess: invalidate,
  });

  const error =
    reserve.error instanceof Error
      ? reserve.error
      : sell.error instanceof Error
        ? sell.error
        : relist.error instanceof Error
          ? relist.error
          : null;

  return {
    reserve,
    sell,
    relist,
    isPending: reserve.isPending || sell.isPending || relist.isPending,
    error,
  };
}

export type ListingDeal = ReturnType<typeof useListingDeal>;

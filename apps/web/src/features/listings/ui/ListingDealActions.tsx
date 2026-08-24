import type { ListingDeal } from '@/features/listings/model/use-listing-deal';
import { Button } from '@/shared/ui/button';

export function ListingDealActions({
  listingId,
  status,
  deal,
  size = 'sm',
}: {
  listingId: string;
  status: string;
  deal: ListingDeal;
  size?: 'sm' | 'default';
}) {
  if (status === 'published') {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size={size}
          disabled={deal.isPending}
          onClick={() => deal.reserve.mutate(listingId)}
        >
          Забронировать
        </Button>
        <Button
          type="button"
          size={size}
          disabled={deal.isPending}
          onClick={() => deal.sell.mutate(listingId)}
        >
          Отметить проданным
        </Button>
      </>
    );
  }

  if (status === 'reserved') {
    return (
      <>
        <Button
          type="button"
          size={size}
          disabled={deal.isPending}
          onClick={() => deal.sell.mutate(listingId)}
        >
          Продано
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={size}
          disabled={deal.isPending}
          onClick={() => deal.relist.mutate(listingId)}
        >
          Вернуть в продажу
        </Button>
      </>
    );
  }

  if (status === 'sold') {
    return (
      <Button
        type="button"
        variant="secondary"
        size={size}
        disabled={deal.isPending}
        onClick={() => deal.relist.mutate(listingId)}
      >
        Вернуть в продажу
      </Button>
    );
  }

  return null;
}

import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import { ProductCard, type ProductCardData } from '@/entities/listing/ui/ProductCard';
import type { Paginated } from '@/entities/listing/model/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAuthStore } from '@/shared/model/stores';

type ListingsResponse = Paginated<ProductCardData>;

export function ListingSimilarSection({
  listingId,
  categoryId,
  price,
  currency,
}: {
  listingId: string;
  categoryId: string;
  price: number;
  currency: string;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const minPrice = Math.max(1, Math.round(price * 0.75));
  const maxPrice = Math.round(price * 1.25);

  const query = useQuery({
    queryKey: ['listings', 'similar', listingId, categoryId, minPrice, maxPrice, token],
    queryFn: () => {
      const params = new URLSearchParams({
        categoryId,
        minPrice: String(minPrice),
        maxPrice: String(maxPrice),
        currency,
        pageSize: '4',
        sort: 'newest',
      });
      return apiRequest<ListingsResponse>(`/v1/listings?${params}`, { token });
    },
  });

  const items = (query.data?.items ?? []).filter((item) => item.id !== listingId).slice(0, 3);
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Похожие объявления</CardTitle>
        <Link
          to="/catalog"
          search={{
            minPrice,
            maxPrice,
            currency: currency as 'BYN' | 'RUB' | 'KZT',
          }}
          className="text-primary text-sm"
        >
          Смотреть все
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

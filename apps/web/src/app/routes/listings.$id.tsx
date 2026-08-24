import { createFileRoute } from '@tanstack/react-router';
import { ListingDetailPage } from '@/pages/listing-detail/ui/ListingDetailPage';

export const Route = createFileRoute('/listings/$id')({
  component: ListingDetailRoute,
});

function ListingDetailRoute() {
  const { id } = Route.useParams();
  return <ListingDetailPage listingId={id} />;
}

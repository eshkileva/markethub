import { createFileRoute } from '@tanstack/react-router';
import { CreateListingPage } from '@/pages/create-listing/ui/CreateListingPage';

export const Route = createFileRoute('/listings_/$id/edit')({
  component: EditListingRoute,
});

function EditListingRoute() {
  const { id } = Route.useParams();
  return <CreateListingPage listingId={id} />;
}

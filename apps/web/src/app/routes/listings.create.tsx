import { createFileRoute } from '@tanstack/react-router';
import { CreateListingPage } from '@/pages/create-listing/ui/CreateListingPage';

export const Route = createFileRoute('/listings/create')({
  component: CreateListingPage,
});

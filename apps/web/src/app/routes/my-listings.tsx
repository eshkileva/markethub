import { createFileRoute } from '@tanstack/react-router';
import { MyListingsPage } from '@/pages/my-listings/ui/MyListingsPage';

export const Route = createFileRoute('/my-listings')({
  component: MyListingsPage,
});

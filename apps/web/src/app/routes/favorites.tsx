import { createFileRoute } from '@tanstack/react-router';
import { FavoritesPage } from '@/pages/favorites/ui/FavoritesPage';

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage,
});

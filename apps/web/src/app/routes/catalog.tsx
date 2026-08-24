import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/pages/catalog/ui/CatalogPage';
import { catalogSearchSchema } from '@/pages/catalog/model/search';

export const Route = createFileRoute('/catalog')({
  validateSearch: catalogSearchSchema,
  component: CatalogPage,
});

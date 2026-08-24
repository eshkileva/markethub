import { createFileRoute } from '@tanstack/react-router';
import { PurchasesPage } from '@/pages/purchases/ui/PurchasesPage';

export const Route = createFileRoute('/purchases')({
  component: PurchasesPage,
});

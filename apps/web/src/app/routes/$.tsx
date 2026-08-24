import { createFileRoute } from '@tanstack/react-router';
import { NotFoundPage } from '@/pages/common/ui/NotFoundPage';

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

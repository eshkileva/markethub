import { createFileRoute } from '@tanstack/react-router';
import { TermsPage } from '@/pages/legal/ui/TermsPage';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

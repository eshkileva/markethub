import { createFileRoute } from '@tanstack/react-router';
import { PrivacyPage } from '@/pages/legal/ui/PrivacyPage';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

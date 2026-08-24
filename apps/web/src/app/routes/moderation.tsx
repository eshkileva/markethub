import { createFileRoute } from '@tanstack/react-router';
import { ModerationPage } from '@/pages/moderation/ui/ModerationPage';

export const Route = createFileRoute('/moderation')({
  component: ModerationPage,
});

import { createFileRoute } from '@tanstack/react-router';
import { NotificationsPage } from '@/pages/notifications/ui/NotificationsPage';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

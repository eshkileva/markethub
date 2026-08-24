import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/pages/settings/ui/SettingsPage';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

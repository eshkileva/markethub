import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/pages/auth/ui/AuthPage';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

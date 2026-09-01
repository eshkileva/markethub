import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordPage } from '@/pages/forgot-password/ui/ForgotPasswordPage';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});

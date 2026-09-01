import { createFileRoute } from '@tanstack/react-router';
import { VerifyEmailPage } from '@/pages/verify-email/ui/VerifyEmailPage';

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
});

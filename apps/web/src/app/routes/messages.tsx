import { createFileRoute } from '@tanstack/react-router';
import { MessagesPage } from '@/pages/messages/ui/MessagesPage';
import { messagesSearchSchema } from '@/pages/messages/model/search';

export const Route = createFileRoute('/messages')({
  validateSearch: messagesSearchSchema,
  component: MessagesPage,
});

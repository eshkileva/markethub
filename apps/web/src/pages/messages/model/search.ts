import { z } from 'zod';

const empty = (value: unknown) => (value === '' || value === null ? undefined : value);

export const messagesSearchSchema = z.object({
  conversation: z.preprocess(empty, z.string().uuid().optional()),
});

export type MessagesSearch = z.infer<typeof messagesSearchSchema>;

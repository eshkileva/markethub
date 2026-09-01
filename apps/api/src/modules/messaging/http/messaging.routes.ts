import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createConversationSchema, sendMessageSchema } from '@markethub/shared';
import { z } from 'zod';

const idParams = z.object({
  id: z.string().uuid(),
});

export const messagingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: { tags: ['messaging'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.messaging.list(request.user!.id),
  );

  app.get(
    '/unread-count',
    {
      schema: { tags: ['messaging'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.messaging.unreadCount(request.user!.id),
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['messaging'],
        body: createConversationSchema,
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
    },
    async (request, reply) => {
      const conversation = await app.services.messaging.open(
        request.user!.id,
        request.body.listingId,
      );
      return reply.status(201).send(conversation);
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['messaging'],
        params: idParams,
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.messaging.get(request.user!.id, request.params.id),
  );

  app.get(
    '/:id/assist',
    {
      schema: {
        tags: ['messaging'],
        params: idParams,
        response: {
          200: z.object({
            role: z.enum(['buyer', 'seller']),
            categorySlug: z.string().nullable(),
            listingTitle: z.string(),
            questions: z.array(z.string()),
            safeDealTips: z.array(z.string()),
          }),
        },
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.messaging.buyerAssist(request.user!.id, request.params.id),
  );

  app.post(
    '/:id/messages',
    {
      schema: {
        tags: ['messaging'],
        params: idParams,
        body: sendMessageSchema,
        response: {
          201: z.object({
            id: z.string().uuid(),
            senderId: z.string().uuid(),
            body: z.string(),
            createdAt: z.string(),
            warnings: z.array(z.string()).optional(),
          }),
        },
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
    },
    async (request, reply) => {
      const message = await app.services.messaging.send(
        request.user!.id,
        request.params.id,
        request.body.body,
      );
      return reply.status(201).send(message);
    },
  );
};

import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { notificationListQuerySchema } from '@markethub/shared';
import { z } from 'zod';

export const notificationsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: ['notifications'],
        querystring: notificationListQuerySchema,
      },
      preHandler: [app.authenticate],
    },
    async (request) =>
      app.services.notifications.list(request.user!.id, request.query.page, request.query.pageSize),
  );

  app.get(
    '/unread-count',
    {
      schema: { tags: ['notifications'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.notifications.unreadCount(request.user!.id),
  );

  app.post(
    '/read-all',
    {
      schema: { tags: ['notifications'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.notifications.markAllRead(request.user!.id),
  );

  app.post(
    '/:id/read',
    {
      schema: {
        tags: ['notifications'],
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.notifications.markRead(request.user!.id, request.params.id),
  );
};

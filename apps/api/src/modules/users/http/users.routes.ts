import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/:id/verify',
    {
      schema: {
        tags: ['users'],
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => app.services.users.setVerified(request.params.id, true),
  );

  app.post(
    '/:id/unverify',
    {
      schema: {
        tags: ['users'],
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => app.services.users.setVerified(request.params.id, false),
  );

  app.get(
    '/:username',
    {
      schema: {
        tags: ['users'],
        params: z.object({ username: z.string().min(1).max(32) }),
      },
    },
    async (request) => app.services.users.getByUsername(request.params.username),
  );
};

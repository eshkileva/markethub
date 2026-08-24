import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const addFavoriteSchema = z.object({
  listingId: z.string().uuid(),
});

export const favoritesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: { tags: ['favorites'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.favorites.list(request.user!.id),
  );

  app.get(
    '/ids',
    {
      schema: { tags: ['favorites'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.favorites.ids(request.user!.id),
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['favorites'],
        body: addFavoriteSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const result = await app.services.favorites.add(request.user!.id, request.body.listingId);
      return reply.status(201).send(result);
    },
  );

  app.delete(
    '/:listingId',
    {
      schema: { tags: ['favorites'] },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { listingId } = request.params as { listingId: string };
      await app.services.favorites.remove(request.user!.id, listingId);
      return reply.status(204).send();
    },
  );
};

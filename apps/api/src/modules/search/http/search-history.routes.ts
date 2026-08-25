import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { recordSearchHistorySchema } from '@markethub/shared';
import { z } from 'zod';

export const searchHistoryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: { tags: ['search-history'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.searchHistory.list(request.user!.id),
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['search-history'],
        body: recordSearchHistorySchema,
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const result = await app.services.searchHistory.record(
        request.user!.id,
        request.body.query,
      );
      return reply.status(201).send(result);
    },
  );

  app.delete(
    '/',
    {
      schema: { tags: ['search-history'] },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      await app.services.searchHistory.clear(request.user!.id);
      return reply.status(204).send();
    },
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['search-history'],
        params: z.object({ id: z.string().uuid() }),
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      await app.services.searchHistory.remove(request.user!.id, request.params.id);
      return reply.status(204).send();
    },
  );
};

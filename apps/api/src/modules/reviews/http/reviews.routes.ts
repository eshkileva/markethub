import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createReviewSchema, paginationQuerySchema } from '@markethub/shared';
import { z } from 'zod';

export const reviewsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/users/:userId',
    {
      schema: {
        tags: ['reviews'],
        params: z.object({ userId: z.string().uuid() }),
        querystring: paginationQuerySchema,
      },
    },
    async (request) =>
      app.services.reviews.listForUser(
        request.params.userId,
        request.query.page,
        request.query.pageSize,
      ),
  );

  app.get(
    '/listing/:listingId',
    {
      schema: {
        tags: ['reviews'],
        params: z.object({ listingId: z.string().uuid() }),
      },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.reviews.eligibility(request.user!.id, request.params.listingId),
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['reviews'],
        body: createReviewSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const review = await app.services.reviews.create(request.user!.id, request.body);
      return reply.status(201).send(review);
    },
  );
};

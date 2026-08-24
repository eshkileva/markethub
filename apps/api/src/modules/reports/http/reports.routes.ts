import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createReportSchema, reportListQuerySchema, resolveReportSchema } from '@markethub/shared';
import { z } from 'zod';

export const reportsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/',
    {
      schema: {
        tags: ['moderation'],
        body: createReportSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const report = await app.services.reports.create(request.user!.id, request.body);
      return reply.status(201).send(report);
    },
  );

  app.get(
    '/',
    {
      schema: {
        tags: ['moderation'],
        querystring: reportListQuerySchema,
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) =>
      app.services.reports.list(request.query.status, request.query.page, request.query.pageSize),
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['moderation'],
        params: z.object({ id: z.string().uuid() }),
        body: resolveReportSchema,
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => app.services.reports.resolve(request.params.id, request.body.action),
  );
};

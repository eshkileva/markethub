import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const purchasesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: { tags: ['purchases'] },
      preHandler: [app.authenticate],
    },
    async (request) => app.services.messaging.listPurchases(request.user!.id),
  );
};

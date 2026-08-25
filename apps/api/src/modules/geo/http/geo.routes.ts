import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { citiesQuerySchema } from '@markethub/shared';

export const geoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/cities',
    {
      schema: {
        tags: ['geo'],
        querystring: citiesQuerySchema,
      },
    },
    async (request) => ({
      items: await app.services.geo.listCities(request.query.country, request.query.q),
    }),
  );
};

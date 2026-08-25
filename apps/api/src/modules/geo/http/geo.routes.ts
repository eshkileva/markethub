import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { citiesQuerySchema, listCities } from '@markethub/shared';

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
      items: listCities(request.query.country, request.query.q),
    }),
  );
};

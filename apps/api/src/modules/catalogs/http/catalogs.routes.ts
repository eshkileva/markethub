import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  catalogBrandsQuerySchema,
  catalogKindSchema,
  catalogModelsQuerySchema,
} from '@markethub/shared';
import { z } from 'zod';
import { parseKind } from '../application/catalogs.service.js';

const kindParams = z.object({ kind: catalogKindSchema });

export const catalogsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/:kind/brands',
    {
      schema: {
        tags: ['catalogs'],
        params: kindParams,
        querystring: catalogBrandsQuerySchema,
      },
    },
    async (request) =>
      app.services.catalogs.listBrands(parseKind(request.params.kind), request.query.q),
  );

  app.get(
    '/:kind/models',
    {
      schema: {
        tags: ['catalogs'],
        params: kindParams,
        querystring: catalogModelsQuerySchema,
      },
    },
    async (request) =>
      app.services.catalogs.listModels(
        parseKind(request.params.kind),
        request.query.brand,
        request.query.q,
      ),
  );
};

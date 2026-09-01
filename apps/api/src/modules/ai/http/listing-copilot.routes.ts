import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  listingCopilotRequestSchema,
  listingCopilotResponseSchema,
  listingPriceInsightQuerySchema,
  listingPriceInsightResponseSchema,
  listingReassessSchema,
  listingReassessResponseSchema,
  searchIntentRequestSchema,
  searchIntentResponseSchema,
} from '@markethub/shared';
import { z } from 'zod';

export const listingCopilotRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/listing-copilot',
    {
      schema: {
        tags: ['ai'],
        body: listingCopilotRequestSchema,
        response: { 200: listingCopilotResponseSchema },
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
      config: {
        rateLimit: { max: 8, timeWindow: '1 minute' },
      },
    },
    async (request) => app.services.listingCopilot.analyze(request.user!.id, request.body),
  );

  app.post(
    '/listing-reassess',
    {
      schema: {
        tags: ['ai'],
        body: listingReassessSchema,
        response: { 200: listingReassessResponseSchema },
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    async (request) => app.services.listingCopilot.reassess(request.body),
  );

  app.post(
    '/search-intent',
    {
      schema: {
        tags: ['ai'],
        body: searchIntentRequestSchema,
        response: { 200: searchIntentResponseSchema },
      },
      preHandler: [app.tryAuthenticate],
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
    },
    async (request) => app.services.searchIntent.parse(request.body),
  );

  app.get(
    '/price-insight',
    {
      schema: {
        tags: ['ai'],
        querystring: listingPriceInsightQuerySchema,
        response: { 200: listingPriceInsightResponseSchema },
      },
      preHandler: [app.authenticate],
    },
    async (request) =>
      app.services.listingCopilot.priceInsight(
        request.query.categoryId,
        request.query.country,
        request.query.currency,
      ),
  );

  app.get(
    '/status',
    {
      schema: {
        tags: ['ai'],
        response: {
          200: z.object({
            enabled: z.boolean(),
            model: z.string().nullable(),
          }),
        },
      },
    },
    async () => ({
      enabled: app.config.aiEnabled,
      model: app.config.OPENROUTER_MODEL ?? null,
    }),
  );
};

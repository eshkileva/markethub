import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  listingCopilotRequestSchema,
  listingPriceInsightQuerySchema,
  listingReassessSchema,
  searchIntentRequestSchema,
  searchIntentResponseSchema,
} from '@markethub/shared';
import { z } from 'zod';

const assessmentSchema = z.object({
  riskScore: z.number().int(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  baseRiskScore: z.number().int(),
  reasons: z.array(z.string()),
  sellerTrustScore: z.number().int(),
  listingTrustScore: z.number().int(),
  price: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    median: z.number().nullable(),
    sampleSize: z.number().int(),
    verdict: z.enum(['low', 'fair', 'high', 'unknown']),
    currency: z.string(),
  }),
  model: z.string(),
  assessedAt: z.string(),
});

const copilotResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  categoryId: z.string().uuid(),
  categorySlug: z.string(),
  condition: z.enum(['new', 'used', 'for_parts']),
  attributes: z.array(
    z.object({
      attributeId: z.string().uuid(),
      key: z.string(),
      labelRu: z.string(),
      value: z.string(),
    }),
  ),
  suggestedPrice: z.number().nullable(),
  assessment: assessmentSchema,
  aiEnabled: z.boolean(),
});

export const listingCopilotRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/listing-copilot',
    {
      schema: {
        tags: ['ai'],
        body: listingCopilotRequestSchema,
        response: { 200: copilotResponseSchema },
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
        response: { 200: z.object({ assessment: assessmentSchema }) },
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
        response: {
          200: z.object({
            min: z.number().nullable(),
            max: z.number().nullable(),
            median: z.number().nullable(),
            sampleSize: z.number().int(),
            currency: z.string(),
          }),
        },
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

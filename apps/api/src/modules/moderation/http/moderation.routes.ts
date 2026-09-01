import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { moderationQueueQuerySchema, moderationRejectSchema } from '@markethub/shared';
import { z } from 'zod';
import { serializeListing } from '../../listings/http/listings.serialize.js';

const listingIdParams = z.object({ id: z.string().uuid() });

const queueItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  country: z.string(),
  city: z.string(),
  condition: z.string(),
  status: z.string(),
  categoryId: z.string().uuid(),
  listingTrustScore: z.number().nullable(),
  aiRiskLevel: z.string().nullable(),
  aiAssessment: z.record(z.string(), z.unknown()).nullable(),
  aiAssessedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  imageUrl: z.string().nullable(),
  seller: z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    trustScore: z.number(),
    isVerified: z.boolean(),
    emailVerified: z.boolean(),
    accountAgeDays: z.number(),
    listingCount: z.number(),
  }),
  duplicateHints: z.array(z.string()),
});

export const moderationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/listings',
    {
      schema: {
        tags: ['moderation'],
        querystring: moderationQueueQuerySchema,
        response: {
          200: z.object({
            items: z.array(queueItemSchema),
            page: z.number(),
            pageSize: z.number(),
            total: z.number(),
          }),
        },
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => {
      const result = await app.services.moderation.listQueue(request.query);
      return {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        items: result.items.map((item) => ({
          ...serializeListing(item.listing),
          imageUrl: item.imageUrl,
          seller: item.seller,
          duplicateHints: item.duplicateHints,
        })),
      };
    },
  );

  app.post(
    '/listings/:id/approve',
    {
      schema: {
        tags: ['moderation'],
        params: listingIdParams,
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => {
      const listing = await app.services.moderation.approve(request.params.id);
      return serializeListing(listing);
    },
  );

  app.post(
    '/listings/:id/reject',
    {
      schema: {
        tags: ['moderation'],
        params: listingIdParams,
        body: moderationRejectSchema,
      },
      preHandler: [app.authenticate, app.requireModerator],
    },
    async (request) => {
      const listing = await app.services.moderation.reject(request.params.id, request.body.note);
      return serializeListing(listing);
    },
  );
};

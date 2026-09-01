import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  createListingSchema,
  listingFilterSchema,
  listingMineQuerySchema,
  publishListingSchema,
} from '@markethub/shared';
import { z } from 'zod';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { serializeListing } from './listings.serialize.js';
import { findListingById, getListingDetail, listCatalog, listMine } from './listings.query.js';

const attachImageSchema = z.object({
  url: z.string().url(),
});

const listingIdParams = z.object({ id: z.string().uuid() });

export const listingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: ['listings'],
        querystring: listingFilterSchema,
      },
      preHandler: [app.tryAuthenticate],
    },
    async (request) =>
      listCatalog(
        app.db,
        request.query,
        request.user?.id ?? null,
        await app.services.rates.getRates(),
      ),
  );

  app.get(
    '/mine',
    {
      schema: {
        tags: ['listings'],
        querystring: listingMineQuerySchema,
      },
      preHandler: [app.authenticate],
    },
    async (request) => listMine(app.db, request.user!.id, request.query.status),
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['listings'],
        body: createListingSchema,
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
    },
    async (request, reply) => {
      const listing = await app.services.listings.createDraft(request.user!.id, request.body);
      return reply.status(201).send(serializeListing(listing));
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['listings'],
        params: listingIdParams,
        body: createListingSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request) => {
      const listing = await app.services.listings.update(
        request.user!.id,
        request.params.id,
        request.body,
      );
      return serializeListing(listing);
    },
  );

  app.post(
    '/:id/publish',
    {
      schema: {
        tags: ['listings'],
        params: listingIdParams,
        body: publishListingSchema.default({}),
      },
      preHandler: [app.authenticate, app.requireVerifiedEmail],
    },
    async (request) => {
      const listing = await app.services.listings.publish(request.user!.id, request.params.id);
      return serializeListing(listing);
    },
  );

  app.post(
    '/:id/archive',
    {
      schema: {
        tags: ['listings'],
        params: listingIdParams,
      },
      preHandler: [app.authenticate],
    },
    async (request) => {
      const listing = await app.services.listings.archive(request.user!.id, request.params.id);
      return serializeListing(listing);
    },
  );

  app.post(
    '/:id/reserve',
    {
      schema: { tags: ['listings'], params: listingIdParams },
      preHandler: [app.authenticate],
    },
    async (request) =>
      serializeListing(await app.services.listings.reserve(request.user!.id, request.params.id)),
  );

  app.post(
    '/:id/sell',
    {
      schema: { tags: ['listings'], params: listingIdParams },
      preHandler: [app.authenticate],
    },
    async (request) =>
      serializeListing(await app.services.listings.sell(request.user!.id, request.params.id)),
  );

  app.post(
    '/:id/relist',
    {
      schema: { tags: ['listings'], params: listingIdParams },
      preHandler: [app.authenticate],
    },
    async (request) =>
      serializeListing(await app.services.listings.relist(request.user!.id, request.params.id)),
  );

  app.post(
    '/:id/images',
    {
      schema: {
        tags: ['listings'],
        params: listingIdParams,
        body: attachImageSchema,
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const image = await app.services.listings.attachImage(
        request.user!.id,
        request.params.id,
        request.body.url,
      );
      return reply.status(201).send({
        id: image.id,
        url: image.url,
        sortOrder: image.sortOrder,
      });
    },
  );

  app.delete(
    '/:id/images/:imageId',
    {
      schema: {
        tags: ['listings'],
        params: z.object({
          id: z.string().uuid(),
          imageId: z.string().uuid(),
        }),
      },
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      await app.services.listings.removeImage(
        request.user!.id,
        request.params.id,
        request.params.imageId,
      );
      return reply.status(204).send();
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['listings'],
        params: listingIdParams,
      },
      preHandler: [app.tryAuthenticate],
    },
    async (request) => {
      const listing = await findListingById(app.db, request.params.id);
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }

      const viewerId = request.user?.id ?? null;
      const isOwner = viewerId === listing.sellerId;
      const isModerator = request.user?.role === 'moderator' || request.user?.role === 'admin';
      const isPeer =
        Boolean(viewerId) &&
        (await app.services.messaging.isParticipantOnListing(request.params.id, viewerId!));
      if (listing.status !== 'published' && !isOwner && !isPeer && !isModerator) {
        throw new NotFoundError('Listing not found');
      }

      return getListingDetail(app.db, listing, viewerId, await app.services.rates.getRates());
    },
  );
};

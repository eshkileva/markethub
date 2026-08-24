import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import { MAX_UPLOAD_BYTES } from '@markethub/shared';
import { ValidationError } from '../../../shared/errors/app-error.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', { schema: { tags: ['media'] } }, async () => ({
    bucket: app.config.S3_BUCKET,
    endpoint: app.config.S3_ENDPOINT,
  }));

  app.post(
    '/upload',
    {
      schema: { tags: ['media'] },
      preHandler: [app.authenticate],
    },
    async (request) => {
      const file = await request.file();
      if (!file) {
        throw new ValidationError('File is required');
      }
      if (!ALLOWED_TYPES.has(file.mimetype)) {
        throw new ValidationError('Only JPEG, PNG, WebP and GIF images are allowed');
      }

      const buffer = await file.toBuffer();
      if (buffer.byteLength === 0) {
        throw new ValidationError('Empty file');
      }
      if (buffer.byteLength > MAX_UPLOAD_BYTES) {
        throw new ValidationError('File must be 5 MB or smaller');
      }

      const extension = extname(file.filename || '').toLowerCase() || '.jpg';
      const key = `uploads/${request.user!.id}/${randomUUID()}${extension}`;
      const stored = await app.storage.putObject(key, buffer, file.mimetype);

      return {
        key: stored.key,
        url: stored.url,
        contentType: file.mimetype,
        size: buffer.byteLength,
      };
    },
  );
};

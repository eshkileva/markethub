import type { FastifyPluginAsync } from 'fastify';
import { buildRobotsTxt, normalizeSiteOrigin } from '@markethub/shared';
import { buildLiveSitemap } from '../infrastructure/sitemap.js';

export const seoRoutes: FastifyPluginAsync = async (app) => {
  const siteOrigin = normalizeSiteOrigin(app.config.WEB_ORIGIN);

  app.get('/robots.txt', async (_request, reply) =>
    reply
      .type('text/plain; charset=utf-8')
      .header('Cache-Control', 'public, max-age=300')
      .send(buildRobotsTxt(siteOrigin)),
  );

  app.get('/sitemap.xml', async (_request, reply) => {
    const xml = await buildLiveSitemap(app.db, siteOrigin);
    return reply
      .type('application/xml; charset=utf-8')
      .header('Cache-Control', 'public, max-age=600')
      .send(xml);
  });
};

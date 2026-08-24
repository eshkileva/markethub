import type { FastifyPluginAsync } from 'fastify';

export const categoriesRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      schema: { tags: ['categories'] },
    },
    async () => {
      const rows = await app.db.query.categories.findMany({
        orderBy: (table, { asc }) => [asc(table.sortOrder)],
      });
      return {
        items: rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          nameRu: row.nameRu,
          parentId: row.parentId,
          icon: row.icon,
          sortOrder: row.sortOrder,
        })),
      };
    },
  );

  app.get(
    '/:id/attributes',
    {
      schema: { tags: ['categories'] },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const attrs = await app.db.query.categoryAttributes.findMany({
        where: (table, { eq: equals }) => equals(table.categoryId, id),
        orderBy: (table, { asc }) => [asc(table.sortOrder)],
      });
      return { items: attrs };
    },
  );
};

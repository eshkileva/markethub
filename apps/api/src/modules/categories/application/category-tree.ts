export function listingCategoryIds(
  rows: Array<{ id: string; parentId: string | null }>,
  categoryId: string,
): string[] {
  const childIds = rows.filter((row) => row.parentId === categoryId).map((row) => row.id);
  return childIds.length > 0 ? [categoryId, ...childIds] : [categoryId];
}

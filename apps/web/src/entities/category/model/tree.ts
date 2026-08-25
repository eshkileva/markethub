export type CategoryItem = {
  id: string;
  slug: string;
  nameRu: string;
  parentId: string | null;
  icon?: string | null;
};

export function categoryRoots(items: CategoryItem[]) {
  return items.filter((item) => !item.parentId);
}

export function categoryChildren(items: CategoryItem[], parentId: string) {
  return items.filter((item) => item.parentId === parentId);
}

export function findCategory(items: CategoryItem[], slug: string | undefined) {
  if (!slug) return undefined;
  return items.find((item) => item.slug === slug);
}

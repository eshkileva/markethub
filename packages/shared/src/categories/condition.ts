export const SERVICE_PARENT_SLUG = 'services';
export const JOBS_PARENT_SLUG = 'jobs';

const CONDITION_OPTIONAL_PARENTS = new Set([SERVICE_PARENT_SLUG, JOBS_PARENT_SLUG]);

export function categoryRequiresCondition(parentSlug: string | null | undefined): boolean {
  if (!parentSlug) return true;
  return !CONDITION_OPTIONAL_PARENTS.has(parentSlug);
}

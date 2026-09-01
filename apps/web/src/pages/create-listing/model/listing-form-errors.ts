import type { ZodIssue } from 'zod';

export const LISTING_FORM_FIELD_ORDER = [
  'photos',
  'categoryId',
  'title',
  'description',
  'price',
  'currency',
  'country',
  'city',
  'condition',
  'deliveryModes',
] as const;

export function attributeFieldKey(attributeId: string) {
  return `attributes.${attributeId}`;
}

export function zodIssuesToFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0] != null ? String(issue.path[0]) : 'form';
    if (key === 'attributes') continue;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function scrollToFirstFieldError(errors: Record<string, string>) {
  const attributeKeys = Object.keys(errors)
    .filter((key) => key.startsWith('attributes.'))
    .sort();
  const ordered = [
    ...LISTING_FORM_FIELD_ORDER.filter((key) => errors[key]),
    ...attributeKeys,
  ];
  const first = ordered[0];
  if (!first) return;
  document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function listingSectionHasError(
  step: number,
  errors: Record<string, string>,
  withAttributes: boolean,
) {
  const keys = Object.keys(errors);
  switch (step) {
    case 1:
      return keys.includes('photos');
    case 2:
      return keys.some((key) => key === 'categoryId' || key === 'condition');
    case 3:
      return keys.some((key) => key === 'title' || key === 'description');
    case 4:
      return withAttributes && keys.some((key) => key.startsWith('attributes.'));
    case 5:
      return withAttributes
        ? keys.some((key) => key === 'price' || key === 'currency')
        : keys.some(
            (key) =>
              key === 'price' ||
              key === 'currency' ||
              key === 'country' ||
              key === 'city' ||
              key === 'deliveryModes',
          );
    case 6:
      return keys.some((key) => key === 'country' || key === 'city' || key === 'deliveryModes');
    default:
      return false;
  }
}

export function listingFormErrorCount(errors: Record<string, string>) {
  return Object.keys(errors).length;
}

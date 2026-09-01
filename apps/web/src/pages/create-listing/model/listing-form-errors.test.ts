import { describe, expect, it } from 'vitest';
import { zodIssuesToFieldErrors, attributeFieldKey } from './listing-form-errors';
import { createListingSchema } from '@markethub/shared';

describe('listing form errors', () => {
  it('maps zod issues to field keys with Russian messages', () => {
    const parsed = createListingSchema.safeParse({
      title: 'abc',
      description: 'short',
      categoryId: 'not-a-uuid',
      price: '',
      currency: 'RUB',
      country: 'RU',
      city: '',
      condition: 'used',
      deliveryModes: [],
      attributes: [],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = zodIssuesToFieldErrors(parsed.error.issues);
      expect(errors.city).toBe('Укажите город');
      expect(errors.price).toBeTruthy();
    }
  });

  it('builds attribute field keys', () => {
    expect(attributeFieldKey('attr-1')).toBe('attributes.attr-1');
  });
});

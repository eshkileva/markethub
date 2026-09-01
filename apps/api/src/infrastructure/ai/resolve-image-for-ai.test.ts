import { describe, expect, it } from 'vitest';
import { objectKeyFromPublicUrl } from './resolve-image-for-ai.js';

describe('objectKeyFromPublicUrl', () => {
  const config = {
    S3_PUBLIC_URL: 'http://localhost:9000/markethub',
  } as never;

  it('extracts object key from a public media URL', () => {
    expect(
      objectKeyFromPublicUrl(
        config,
        'http://localhost:9000/markethub/uploads/user/photo.jpg',
      ),
    ).toBe('uploads/user/photo.jpg');
  });

  it('returns null for external URLs', () => {
    expect(objectKeyFromPublicUrl(config, 'https://cdn.example.com/photo.jpg')).toBeNull();
  });
});

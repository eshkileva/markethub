import { test } from '@playwright/test';
import { expectAuthRedirect } from './helpers/auth';

test('my listings redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/my-listings');
});

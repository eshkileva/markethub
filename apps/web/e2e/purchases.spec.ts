import { test } from '@playwright/test';
import { expectAuthRedirect } from './helpers/auth';

test('purchases redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/purchases');
});

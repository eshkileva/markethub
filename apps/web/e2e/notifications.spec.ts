import { test } from '@playwright/test';
import { expectAuthRedirect } from './helpers/auth';

test('notifications redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/notifications');
});

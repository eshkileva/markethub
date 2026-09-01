import { test, expect } from '@playwright/test';
import { expectAuthRedirect } from './helpers/auth';

test('settings redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/settings');
});

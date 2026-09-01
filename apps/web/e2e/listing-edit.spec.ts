import { test } from '@playwright/test';
import { expectAuthRedirect } from './helpers/auth';

test('edit listing redirects to auth when signed out', async ({ page }) => {
  await expectAuthRedirect(page, '/listings/00000000-0000-4000-8000-000000000001/edit');
});

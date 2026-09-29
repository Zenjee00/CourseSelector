import {
  expect,
  test,
} from '@playwright/test';

test.describe('Offline and online states', () => {
  test('shows the offline banner and removes it after reconnection', async ({
    page,
    context,
  }) => {
    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: 'Login' }),
    ).toBeVisible();

    const connectionBanner = page
      .locator('[role="status"], [role="alert"]')
      .filter({
        hasText: /offline|no internet|connection/i,
      });

    await expect(connectionBanner).toHaveCount(0);

    await context.setOffline(true);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await expect(connectionBanner).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => navigator.onLine))
      .toBe(false);

    // Existing UI should remain usable while offline.
    await page
      .getByLabel('Email')
      .fill('offline-user@example.com');

    await expect(
      page.getByLabel('Email'),
    ).toHaveValue('offline-user@example.com');

    await context.setOffline(false);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    await expect(connectionBanner).toHaveCount(0);

    await expect
      .poll(() => page.evaluate(() => navigator.onLine))
      .toBe(true);
  });

  test('does not incorrectly authenticate while offline', async ({
    page,
    context,
  }) => {
    await page.goto('/login');

    await context.setOffline(true);

    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await page.goto('/home').catch(() => {});

    // Return online so the SPA can complete its route guard.
    await context.setOffline(false);

    await page.goto('/home');

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole('heading', { name: 'Login' }),
    ).toBeVisible();
  });
});
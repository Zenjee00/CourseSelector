import {
  devices,
  expect,
  test,
} from '@playwright/test';

import {
  expectNoHorizontalOverflow,
  registerVerifyAndLogin,
  resetFirebaseEmulators,
} from './firebaseEmulator';

test.use({
  ...devices['Pixel 7'],
});

test.describe('Mobile layout', () => {
  test.beforeEach(async ({ request }) => {
    await resetFirebaseEmulators(request);
  });

  test('login and registration forms fit inside the mobile viewport', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(
      page.getByRole('heading', { name: 'Login' }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);

    const loginForm = page.locator('.form-wrapper');
    const box = await loginForm.boundingBox();

    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(
      413,
    );

    await page
      .getByText('Register', { exact: true })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Register' }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('home page uses the mobile navigation menu', async ({
    page,
    request,
  }) => {
    await registerVerifyAndLogin(page, request);

    await expectNoHorizontalOverflow(page);

    const menuButton = page.getByRole('button', {
      name: 'Toggle navigation menu',
    });

    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await menuButton.click();

    await expect(menuButton).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await expect(
      page.getByRole('button', {
        name: 'Open career library',
      }),
    ).toBeVisible();

    const modeCards = page.locator('.mode-card');

    await expect(modeCards).toHaveCount(3);

    for (const card of await modeCards.all()) {
      const cardBox = await card.boundingBox();

      expect(cardBox).not.toBeNull();
      expect(cardBox.x).toBeGreaterThanOrEqual(0);
      expect(
        cardBox.x + cardBox.width,
      ).toBeLessThanOrEqual(413);
    }
  });

  test('career library cards and controls fit on mobile', async ({
    page,
    request,
  }) => {
    await registerVerifyAndLogin(page, request);

    await page.goto('/library');

    await expect(page).toHaveURL(/\/library$/);

    await expect(
      page.getByRole('heading', {
        name: /courses, jobs, and starting salaries/i,
      }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);

    await expect(
      page.getByLabel(/search courses/i),
    ).toBeVisible();

    await expect(
      page.getByLabel(/category/i),
    ).toBeVisible();

    const firstCard = page
      .locator('.library-card')
      .first();

    await expect(firstCard).toBeVisible();

    const cardBox = await firstCard.boundingBox();

    expect(cardBox).not.toBeNull();
    expect(cardBox.x).toBeGreaterThanOrEqual(0);
    expect(
      cardBox.x + cardBox.width,
    ).toBeLessThanOrEqual(413);
  });
});
import {
  expect,
  test,
} from '@playwright/test';

import { resetFirebaseEmulators } from './firebaseEmulator';

test.describe('Google sign-in', () => {
  test.beforeEach(async ({ request }) => {
    await resetFirebaseEmulators(request);
  });

  test('signs in through the Firebase Google popup', async ({
    page,
  }) => {
    await page.goto('/login');

    const popupPromise = page.waitForEvent('popup');

    await page
      .getByRole('button', {
        name: /continue with google/i,
      })
      .click();

    const popup = await popupPromise;

    await popup.waitForLoadState('networkidle');

    const addAccountButton = popup.getByRole(
      'button',
      { name: /add new account/i },
    );

    if (await addAccountButton.isVisible()) {
      await addAccountButton.click();
    }

    const generateButton = popup.getByRole(
      'button',
      { name: /auto-generate/i },
    );

    await expect(generateButton).toBeVisible();
    await generateButton.click();

    const generatedEmail = await popup
      .getByRole('textbox')
      .first()
      .inputValue();

    expect(generatedEmail).toMatch(/@/);

    await popup
      .getByRole('button', {
        name: /sign in with google\.com|sign in/i,
      })
      .last()
      .click();

    await expect(page).toHaveURL(/\/home$/);

    await expect(
      page.getByRole('heading', {
        name: /start your dream course/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', {
        name: 'View profile',
      }),
    ).toBeVisible();
  });
});
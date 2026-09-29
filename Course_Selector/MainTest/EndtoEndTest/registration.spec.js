import {
  expect,
  test,
} from '@playwright/test';

import {
  createTestEmail,
  login,
  openRegistrationForm,
  resetFirebaseEmulators,
  submitRegistration,
  verifyEmail,
} from './firebaseEmulator';

test.describe('Registration and email verification', () => {
  test.beforeEach(async ({ request }) => {
    await resetFirebaseEmulators(request);
  });

  test('redirects unauthenticated users away from protected pages', async ({
    page,
  }) => {
    await page.goto('/home');

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole('heading', { name: 'Login' }),
    ).toBeVisible();
  });

  test('validates password confirmation and minimum length', async ({
    page,
  }) => {
    await openRegistrationForm(page);

    await page
      .getByLabel('Email')
      .fill(createTestEmail());

    await page
      .getByLabel('Password', { exact: true })
      .fill('Password123!');

    await page
      .getByLabel('Confirm Password')
      .fill('DifferentPassword!');

    await page
      .getByRole('button', { name: 'Register' })
      .click();

    await expect(
      page.getByText(/passwords do not match/i),
    ).toBeVisible();

    await page
      .getByLabel('Password', { exact: true })
      .fill('123');

    await page
      .getByLabel('Confirm Password')
      .fill('123');

    await page
      .getByRole('button', { name: 'Register' })
      .click();

    await expect(
      page.getByText(/at least 6 characters/i),
    ).toBeVisible();
  });

  test('blocks an unverified user, then allows login after verification', async ({
    page,
    request,
  }) => {
    const email = createTestEmail('verification');
    const password = 'ValidPassword123!';

    await submitRegistration(
      page,
      email,
      password,
    );

    // Try logging in before verification.
    await login(page, email, password);

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByText(/verification email sent/i),
    ).toBeVisible();

    // Simulate clicking the link from the verification email.
    await verifyEmail(request, email);

    await login(page, email, password);

    await expect(page).toHaveURL(/\/home$/);

    await expect(
      page.getByRole('heading', {
        name: /start your dream course/i,
      }),
    ).toBeVisible();

    // Login only navigates after saveVerifiedProfile succeeds.
    await page
      .getByRole('button', { name: 'View profile' })
      .click();

    const profileDialog = page.getByRole('dialog', {
      name: 'Profile',
    });

    await expect(profileDialog).toBeVisible();

    await expect(
      profileDialog.getByLabel('Email address'),
    ).toHaveValue(email);
  });

  test('rejects duplicate registration', async ({
    page,
  }) => {
    const email = createTestEmail('duplicate');
    const password = 'ValidPassword123!';

    await submitRegistration(
      page,
      email,
      password,
    );

    await openRegistrationForm(page);

    await page
      .getByLabel('Email')
      .fill(email);

    await page
      .getByLabel('Password', { exact: true })
      .fill(password);

    await page
      .getByLabel('Confirm Password')
      .fill(password);

    await page
      .getByRole('button', { name: 'Register' })
      .click();

    await expect(
      page.getByText(/already registered/i),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/login$/);
  });
});
import { expect } from '@playwright/test';

export const PROJECT_ID = 'demo-courseselector';

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080';

export function createTestEmail(prefix = 'student') {
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomPart}@example.com`;
}

export async function resetFirebaseEmulators(request) {
  const authResponse = await request.delete(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`,
  );

  if (!authResponse.ok()) {
    throw new Error(
      `Failed to clear Auth Emulator: ${authResponse.status()}`,
    );
  }

  const firestoreResponse = await request.delete(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
  );

  if (!firestoreResponse.ok()) {
    throw new Error(
      `Failed to clear Firestore Emulator: ${firestoreResponse.status()}`,
    );
  }
}

export async function openRegistrationForm(page) {
  await page.goto('/login');

  await page
    .getByText('Register', { exact: true })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Register' }),
  ).toBeVisible();
}

export async function submitRegistration(
  page,
  email,
  password = 'ValidPassword123!',
) {
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
    page.getByText(/verification email sent/i),
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Login' }),
  ).toBeVisible();
}

export async function getVerificationCode(request, email) {
  const response = await request.get(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/oobCodes`,
  );

  expect(response.ok()).toBe(true);

  const body = await response.json();
  const codes = body.oobCodes ?? [];

  const verificationCode = [...codes]
    .reverse()
    .find((entry) => {
      return (
        entry.email === email &&
        entry.requestType === 'VERIFY_EMAIL'
      );
    });

  if (!verificationCode) {
    throw new Error(
      `No email-verification code found for ${email}`,
    );
  }

  return verificationCode.oobCode;
}

export async function verifyEmail(request, email) {
  const oobCode = await getVerificationCode(
    request,
    email,
  );

  const response = await request.get(
    `${AUTH_EMULATOR}/emulator/action` +
      `?mode=verifyEmail` +
      `&oobCode=${encodeURIComponent(oobCode)}` +
      `&apiKey=fake-api-key`,
  );

  expect(response.ok()).toBe(true);
}

export async function login(
  page,
  email,
  password = 'ValidPassword123!',
) {
  await page.goto('/login');

  await page
    .getByLabel('Email')
    .fill(email);

  await page
    .getByLabel('Password', { exact: true })
    .fill(password);

  await page
    .getByRole('button', { name: 'Login' })
    .click();
}

export async function registerVerifyAndLogin(
  page,
  request,
  options = {},
) {
  const email =
    options.email ?? createTestEmail();

  const password =
    options.password ?? 'ValidPassword123!';

  await submitRegistration(
    page,
    email,
    password,
  );

  await verifyEmail(request, email);

  await login(page, email, password);

  await expect(page).toHaveURL(/\/home$/);

  await expect(
    page.getByRole('heading', {
      name: /start your dream course/i,
    }),
  ).toBeVisible();

  return {
    email,
    password,
  };
}

export async function expectNoHorizontalOverflow(page) {
  const measurements = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    measurements.scrollWidth,
    `Horizontal overflow detected: ${measurements.scrollWidth}px > ${measurements.clientWidth}px`,
  ).toBeLessThanOrEqual(
    measurements.clientWidth + 1,
  );
}
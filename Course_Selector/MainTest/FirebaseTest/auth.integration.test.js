import {
  deleteApp,
  initializeApp,
} from 'firebase/app';
import {
  applyActionCode,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getIdTokenResult,
  initializeAuth,
  inMemoryPersistence,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

const PROJECT_ID = 'demo-courseselector';

const AUTH_EMULATOR_URL =
  process.env.FIREBASE_AUTH_EMULATOR_URL ||
  'http://127.0.0.1:9099';

let app;
let auth;

function createUniqueEmail(label) {
  return `${label}-${Date.now()}-${crypto.randomUUID()}@example.com`;
}

async function clearAuthEmulator() {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to clear Auth Emulator. Status: ${response.status}`,
    );
  }
}

async function getVerificationCode(email) {
  const response = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/oobCodes`,
  );

  if (!response.ok) {
    throw new Error(
      `Unable to read verification codes. Status: ${response.status}`,
    );
  }

  const data = await response.json();
  const oobCodes = data.oobCodes || [];

  const verificationRequest = [...oobCodes]
    .reverse()
    .find(
      (entry) =>
        entry.requestType === 'VERIFY_EMAIL' &&
        entry.email === email,
    );

  if (!verificationRequest?.oobCode) {
    throw new Error(
      `No verification code was generated for ${email}`,
    );
  }

  return verificationRequest.oobCode;
}

beforeAll(() => {
  app = initializeApp(
    {
      apiKey: 'demo-api-key',
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
    },
    `auth-integration-${Date.now()}`,
  );

  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
  });

  connectAuthEmulator(auth, AUTH_EMULATOR_URL, {
    disableWarnings: true,
  });
});

beforeEach(async () => {
  if (auth.currentUser) {
    await signOut(auth);
  }

  await clearAuthEmulator();
});

afterAll(async () => {
  if (auth?.currentUser) {
    await signOut(auth);
  }

  if (app) {
    await deleteApp(app);
  }
});

describe('Firebase Auth integration', () => {
  it('registers a user as unverified', async () => {
    const email = createUniqueEmail('register');
    const password = 'StrongPass123!';

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

    expect(credential.user).toBeDefined();
    expect(credential.user.email).toBe(email);
    expect(credential.user.emailVerified).toBe(false);

    const canAccessProtectedRoutes =
      credential.user.emailVerified === true;

    expect(canAccessProtectedRoutes).toBe(false);
  });

  it('signs in using the correct email and password', async () => {
    const email = createUniqueEmail('login');
    const password = 'StrongPass123!';

    await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await signOut(auth);

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

    expect(credential.user).toBeDefined();
    expect(credential.user.email).toBe(email);
    expect(auth.currentUser?.uid).toBe(
      credential.user.uid,
    );
  });

  it('rejects an incorrect password', async () => {
    const email = createUniqueEmail('wrong-password');
    const correctPassword = 'StrongPass123!';

    await createUserWithEmailAndPassword(
      auth,
      email,
      correctPassword,
    );

    await signOut(auth);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        'WrongPass123!',
      );

      throw new Error(
        'Firebase should reject an incorrect password.',
      );
    } catch (error) {
      expect([
        'auth/wrong-password',
        'auth/invalid-credential',
      ]).toContain(error.code);
    }
  });

  it('rejects a duplicate email registration', async () => {
    const email = createUniqueEmail('duplicate');

    await createUserWithEmailAndPassword(
      auth,
      email,
      'StrongPass123!',
    );

    await expect(
      createUserWithEmailAndPassword(
        auth,
        email,
        'AnotherPass123!',
      ),
    ).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
    });
  });

  it('generates an email verification request', async () => {
    const email =
      createUniqueEmail('verification-request');

    const { user } =
      await createUserWithEmailAndPassword(
        auth,
        email,
        'StrongPass123!',
      );

    expect(user.emailVerified).toBe(false);

    await sendEmailVerification(user);

    const oobCode =
      await getVerificationCode(email);

    expect(oobCode).toBeDefined();
    expect(typeof oobCode).toBe('string');
    expect(oobCode.length).toBeGreaterThan(0);
  });

  it('verifies the email and refreshes the token claim', async () => {
    const email =
      createUniqueEmail('verified-user');

    const { user } =
      await createUserWithEmailAndPassword(
        auth,
        email,
        'StrongPass123!',
      );

    expect(user.emailVerified).toBe(false);

    await sendEmailVerification(user);

    const oobCode =
      await getVerificationCode(email);

    await applyActionCode(auth, oobCode);
    await reload(user);

    const tokenResult =
      await getIdTokenResult(user, true);

    expect(user.emailVerified).toBe(true);

    expect(
      tokenResult.claims.email_verified,
    ).toBe(true);

    const canAccessProtectedRoutes =
      user.emailVerified === true;

    expect(canAccessProtectedRoutes).toBe(true);
  });

  it('keeps an unverified user blocked after signing in again', async () => {
    const email =
      createUniqueEmail('still-unverified');

    const password = 'StrongPass123!';

    await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await signOut(auth);

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

    expect(
      credential.user.emailVerified,
    ).toBe(false);

    const acceptedUser =
      credential.user.emailVerified === true
        ? credential.user
        : null;

    expect(acceptedUser).toBeNull();
  });
});
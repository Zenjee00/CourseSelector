import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-courseselector';
const [FIRESTORE_HOST, FIRESTORE_PORT = '8080'] = (
  process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
).split(':');

let testEnv;

const verifiedDb = (uid) => testEnv.authenticatedContext(uid, {
  email: `${uid}@example.com`,
  email_verified: true,
}).firestore();

const unverifiedDb = (uid) => testEnv.authenticatedContext(uid, {
  email: `${uid}@example.com`,
  email_verified: false,
}).firestore();

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST,
      port: Number(FIRESTORE_PORT),
      rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('/Users rules', () => {
  it('allows a verified owner to create, read, and update their profile', async () => {
    const alice = verifiedDb('alice');
    const profile = doc(alice, 'Users/alice');

    await assertSucceeds(setDoc(profile, { displayName: 'Alice' }));
    await assertSucceeds(getDoc(profile));
    await assertSucceeds(updateDoc(profile, { displayName: 'Alice Updated' }));
  });

  it('denies unauthenticated and unverified profile access', async () => {
    const guest = testEnv.unauthenticatedContext().firestore();

    await assertFails(setDoc(doc(guest, 'Users/guest'), { displayName: 'Guest' }));
    await assertFails(setDoc(doc(unverifiedDb('alice'), 'Users/alice'), {
      displayName: 'Alice',
    }));
  });

  it('denies access to another user profile and denies profile deletion', async () => {
    await seed('Users/alice', { displayName: 'Alice' });

    const bob = verifiedDb('bob');
    const alice = verifiedDb('alice');

    await assertFails(getDoc(doc(bob, 'Users/alice')));
    await assertFails(updateDoc(doc(bob, 'Users/alice'), { displayName: 'Hacked' }));
    await assertFails(deleteDoc(doc(alice, 'Users/alice')));
  });
});

describe('closed collections', () => {
  it('denies every client read and write in /Courses', async () => {
    await seed('Courses/course-1', { name: 'Computer Science' });
    const alice = verifiedDb('alice');

    await assertFails(getDoc(doc(alice, 'Courses/course-1')));
    await assertFails(setDoc(doc(alice, 'Courses/course-2'), { name: 'Nursing' }));
  });

  it('denies every client read and write in /quiz_results', async () => {
    await seed('quiz_results/result-1', { userId: 'alice' });
    const alice = verifiedDb('alice');

    await assertFails(getDoc(doc(alice, 'quiz_results/result-1')));
    await assertFails(setDoc(doc(alice, 'quiz_results/result-2'), { userId: 'alice' }));
  });
});

describe('/Programs catalog rules', () => {
  it('allows verified users to read a valid catalog document', async () => {
    await seed('Programs/catalog-it', {
      category: 'COMPUTER / IT / TECHNOLOGY',
      programs: ['BS Computer Science'],
    });

    await assertSucceeds(getDoc(doc(verifiedDb('alice'), 'Programs/catalog-it')));
  });

  it('denies catalog reads to guests and unverified users', async () => {
    await seed('Programs/catalog-it', {
      category: 'COMPUTER / IT / TECHNOLOGY',
      programs: ['BS Computer Science'],
    });

    const guest = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(guest, 'Programs/catalog-it')));
    await assertFails(getDoc(doc(unverifiedDb('alice'), 'Programs/catalog-it')));
  });

  it('denies client creation of catalog documents', async () => {
    await assertFails(setDoc(doc(verifiedDb('alice'), 'Programs/new-catalog'), {
      category: 'EDUCATION',
      programs: ['Bachelor of Early Childhood Education'],
    }));
  });
});

describe('/Programs quiz-result rules', () => {
  it('allows a verified owner to create, query, update, and delete their result', async () => {
    const alice = verifiedDb('alice');
    const result = doc(alice, 'Programs/alice-result');

    await assertSucceeds(setDoc(result, {
      userId: 'alice',
      Score: 12,
      Recommended_Field: 'Computer/IT/Technology',
    }));

    await assertSucceeds(getDocs(query(
      collection(alice, 'Programs'),
      where('userId', '==', 'alice'),
    )));

    await assertSucceeds(updateDoc(result, { Score: 13 }));
    await assertSucceeds(deleteDoc(result));
  });

  it('denies creating or accessing another user result', async () => {
    await seed('Programs/alice-result', { userId: 'alice', Score: 12 });
    const bob = verifiedDb('bob');

    await assertFails(setDoc(doc(bob, 'Programs/forged-result'), {
      userId: 'alice',
      Score: 15,
    }));
    await assertFails(getDoc(doc(bob, 'Programs/alice-result')));
    await assertFails(updateDoc(doc(bob, 'Programs/alice-result'), { Score: 0 }));
    await assertFails(deleteDoc(doc(bob, 'Programs/alice-result')));
  });

  it('denies changing result ownership or adding catalog fields', async () => {
    await seed('Programs/alice-result', { userId: 'alice', Score: 12 });
    const result = doc(verifiedDb('alice'), 'Programs/alice-result');

    await assertFails(updateDoc(result, { userId: 'bob' }));
    await assertFails(updateDoc(result, { category: 'EDUCATION' }));
    await assertFails(updateDoc(result, { programs: ['Injected Program'] }));
  });

  it('requires an owner-filtered query for saved results', async () => {
    await seed('Programs/alice-result', { userId: 'alice', Score: 12 });
    const alice = verifiedDb('alice');

    await assertSucceeds(getDocs(query(
      collection(alice, 'Programs'),
      where('userId', '==', 'alice'),
    )));
    await assertFails(getDocs(collection(alice, 'Programs')));
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

import {
  CATEGORY,
  deleteUserProgram,
  getUserSavedPrograms,
  saveQuizResults,
} from '../../src/BackendFbase/courseRecommendations.js';

// vi.mock() is hoisted. vi.hoisted() prevents the "before initialization" error.
const firebaseMock = vi.hoisted(() => ({ db: null }));

vi.mock('../../src/BackendFbase/Firebase.js', () => ({
  get db() {
    return firebaseMock.db;
  },
}));

const PROJECT_ID = 'demo-courseselector';
const [FIRESTORE_HOST, FIRESTORE_PORT = '8080'] = (
  process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
).split(':');

let testEnv;

const dbFor = (uid, emailVerified = true) => testEnv.authenticatedContext(uid, {
  email: `${uid}@example.com`,
  email_verified: emailVerified,
}).firestore();

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

async function readWithoutRules(path) {
  let snapshot;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    snapshot = await getDoc(doc(context.firestore(), path));
  });
  return snapshot;
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
  firebaseMock.db = dbFor('alice');
  vi.restoreAllMocks();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('courseRecommendations quiz-result integration', () => {
  it('saves the summed score, mapped field, owner, and deduplicated programs', async () => {
    await saveQuizResults(
      'alice',
      { q1: 4, q2: 5, q3: 3 },
      CATEGORY.IT,
      [
        'BS Computer Science',
        'Bachelor of Science in Computer Science',
        'BA Psychology',
        'BS Psychology',
      ],
    );

    const saved = await getUserSavedPrograms('alice');

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      userId: 'alice',
      Score: 12,
      Recommended_Field: 'Computer/IT/Technology',
      recommendedPrograms: [
        'BS Computer Science',
        'BA Psychology',
        'BS Psychology',
      ],
    });
    expect(saved[0].timestamp).toBeDefined();
  });

  it('retrieves only the signed-in owner results', async () => {
    await seed('Programs/alice-1', {
      userId: 'alice',
      Score: 14,
      Recommended_Field: 'Hospitality/Tourism',
    });
    await seed('Programs/bob-1', {
      userId: 'bob',
      Score: 10,
      Recommended_Field: 'Education',
    });

    const saved = await getUserSavedPrograms('alice');

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: 'alice-1', userId: 'alice', Score: 14 });
  });

  it('returns an empty list when a user tries to query another owner results', async () => {
    await seed('Programs/bob-1', { userId: 'bob', Score: 10 });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const saved = await getUserSavedPrograms('bob');

    expect(saved).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('deletes the owner result through deleteUserProgram', async () => {
    await seed('Programs/alice-1', { userId: 'alice', Score: 14 });

    await deleteUserProgram('alice-1', 'alice');

    expect((await readWithoutRules('Programs/alice-1')).exists()).toBe(false);
  });

  it('rejects deletion of another owner result', async () => {
    await seed('Programs/bob-1', { userId: 'bob', Score: 10 });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(deleteUserProgram('bob-1', 'alice')).rejects.toBeTruthy();
    expect((await readWithoutRules('Programs/bob-1')).exists()).toBe(true);
  });

  it('does not save results for an unverified account', async () => {
    firebaseMock.db = dbFor('alice', false);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await saveQuizResults('alice', { q1: 5 }, CATEGORY.EDU, [
      'Bachelor of Early Childhood Education',
    ]);

    let resultCount = 0;
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snapshot = await getDocs(query(
        collection(context.firestore(), 'Programs'),
        where('userId', '==', 'alice'),
      ));
      resultCount = snapshot.size;
    });

    expect(resultCount).toBe(0);
    expect(console.error).toHaveBeenCalled();
  });
});

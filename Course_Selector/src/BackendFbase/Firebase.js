import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
} from 'firebase/firestore';

const useFirebaseEmulator =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const productionConfig = {
  apiKey: 'AIzaSyCYHVpk-zn7N3y8qp9nvERGDfm39n65F3Q',
  authDomain: 'courseselector-76d5f.firebaseapp.com',
  projectId: 'courseselector-76d5f',
  storageBucket: 'courseselector-76d5f.firebasestorage.app',
  messagingSenderId: '1040290911840',
  appId: '1:1040290911840:web:416b8d119c0a9a6bd4d505',
};

const emulatorConfig = {
  ...productionConfig,
  apiKey: 'fake-api-key',
  authDomain: 'demo-courseselector.firebaseapp.com',
  projectId: 'demo-courseselector',
};

const firebaseConfig = useFirebaseEmulator
  ? emulatorConfig
  : productionConfig;

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const emulatorConnectionKey =
  '__courseSelectorFirebaseEmulatorsConnected';

if (
  useFirebaseEmulator &&
  !globalThis[emulatorConnectionKey]
) {
  connectAuthEmulator(
    auth,
    'http://127.0.0.1:9099',
    { disableWarnings: true },
  );

  connectFirestoreEmulator(
    db,
    '127.0.0.1',
    8080,
  );

  globalThis[emulatorConnectionKey] = true;
}

export default app;
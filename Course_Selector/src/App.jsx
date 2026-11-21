import './App.css';

import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react';

import { onIdTokenChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import {
  auth,
  db,
} from './BackendFbase/Firebase';
import { ToastProvider } from './context/ToastContext';
const CareerLibrary = lazy(() => import('./FrontendJSX/CareerLibrary'));
import GuestFeatureGate from './FrontendJSX/GuestFeatureGate';
const Home = lazy(() => import('./FrontendJSX/Home'));
const InterestAssessmentQuiz = lazy(() => import('./FrontendJSX/InterestAssessmentQuiz'));
const LoginRegister = lazy(() => import('./FrontendJSX/LoginRegister'));
import OfflineBanner from './FrontendJSX/OfflineBanner';
const Onboarding = lazy(() => import('./FrontendJSX/Onboarding'));
import OrbitLoader from './FrontendJSX/OrbitLoader';
const Results = lazy(() => import('./FrontendJSX/Results'));
const Simulator = lazy(() => import('./FrontendJSX/Simulator'));
const SwipeGame = lazy(() => import('./FrontendJSX/SwipeGame'));

function App() {
  const [user, setUser] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    const theme = user
      ? (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light')
      : 'light';

    document.documentElement.setAttribute(
      'data-theme',
      theme,
    );

    document.body.setAttribute(
      'data-theme',
      theme,
    );
  }, [authReady, user]);

  useEffect(() => {
    let isActive = true;
    let sessionVersion = 0;

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
        if (!isActive) return;

        const version = ++sessionVersion;
        setAuthReady(false);
        /*
         * Registration creates a signed-in user before
         * email verification. Keep unverified users on
         * the login page.
         */
        const verifiedUser =
          currentUser?.emailVerified === true
            ? currentUser
            : null;

        let onboardingRequired = false;
        if (verifiedUser) {
          try {
            const profile = await getDoc(doc(db, 'Users', verifiedUser.uid));
            onboardingRequired = !profile.exists()
              || profile.data()?.onboardingCompleted !== true;
          } catch (error) {
            console.error('Could not read onboarding status:', error);
            onboardingRequired = true;
          }
        }

        if (!isActive || version !== sessionVersion) return;
        setAuthSession(currentUser);
        setUser(verifiedUser);
        setNeedsOnboarding(onboardingRequired);
        setAuthReady(true);
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  if (!authReady) {
    return (
      <div className="app-session-loader">
        <OfflineBanner />

        <OrbitLoader label="Restoring your session" />
      </div>
    );
  }

  const isUnverifiedUser = Boolean(authSession && !user);
  const onboardingRedirect = user && needsOnboarding;


  return (
    <ToastProvider>
      {/* Available globally on every route */}
      <OfflineBanner />

      <Router>
        <div className="App">
          <Suspense fallback={<OrbitLoader label="Loading page" />}>
          <Routes>
            <Route
              path="/"
              element={(
                <Navigate
                  to={isUnverifiedUser ? '/login' : user ? (needsOnboarding ? '/onboarding' : '/home') : '/home'}
                  replace
                />
              )}
            />

            <Route
              path="/login"
              element={
                user
                  ? <Navigate to={needsOnboarding ? '/onboarding' : '/home'} replace />
                  : <LoginRegister />
              }
            />

            <Route
              path="/home"
              element={
                isUnverifiedUser
                  ? <Navigate to="/login" replace />
                  : user && needsOnboarding
                  ? <Navigate to="/onboarding" replace />
                  : <Home />
              }
            />

            <Route
              path="/onboarding"
              element={
                user
                  ? <Onboarding onComplete={() => setNeedsOnboarding(false)} />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/library"
              element={
                isUnverifiedUser
                  ? <Navigate to="/login" replace />
                  : user && needsOnboarding
                  ? <Navigate to="/onboarding" replace />
                  : <CareerLibrary />
              }
            />

            <Route
              path="/results"
              element={
                user
                  ? onboardingRedirect ? <Navigate to="/onboarding" replace /> : <Results />
                  : isUnverifiedUser
                    ? <Navigate to="/login" replace />
                  : <GuestFeatureGate feature="saved history" />
              }
            />

            <Route
              path="/who-am-i"
              element={
                isUnverifiedUser
                  ? <Navigate to="/login" replace />
                  : user && needsOnboarding
                  ? <Navigate to="/onboarding" replace />
                  : <InterestAssessmentQuiz />
              }
            />

            <Route
              path="/quiz"
              element={(
                <Navigate
                  to="/who-am-i"
                  replace
                />
              )}
            />

            <Route
              path="/swipe-match"
              element={
                isUnverifiedUser
                  ? <Navigate to="/login" replace />
                  : user && needsOnboarding
                  ? <Navigate to="/onboarding" replace />
                  : <SwipeGame />
              }
            />

            <Route
              path="/day-in-the-life"
              element={
                isUnverifiedUser
                  ? <Navigate to="/login" replace />
                  : user && needsOnboarding
                  ? <Navigate to="/onboarding" replace />
                  : <Simulator />
              }
            />

            <Route
              path="*"
              element={(
                <Navigate
                  to={user ? '/home' : '/login'}
                  replace
                />
              )}
            />
          </Routes>
          </Suspense>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;

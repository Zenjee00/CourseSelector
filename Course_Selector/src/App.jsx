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
import ThemeProvider from './context/ThemeProvider';
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

  const isUnverifiedUser = Boolean(authSession && !user);
  const onboardingRedirect = user && needsOnboarding;


  return (
    <ToastProvider>
      <Router>
        {/* Keep theme ownership active while Firebase and lazy routes are loading. */}
        <ThemeProvider key={user?.uid || 'guest'} userId={user?.uid} ready={authReady}>
        <OfflineBanner />
        {!authReady ? (
          <div className="app-session-loader">
            <OrbitLoader label="Restoring your session" />
          </div>
        ) : (
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
        )}
        </ThemeProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;

import './App.css';

import {
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
import CareerLibrary from './FrontendJSX/CareerLibrary';
import GuestFeatureGate from './FrontendJSX/GuestFeatureGate';
import Home from './FrontendJSX/Home';
import InterestAssessmentQuiz from './FrontendJSX/InterestAssessmentQuiz';
import LoginRegister from './FrontendJSX/LoginRegister';
import OfflineBanner from './FrontendJSX/OfflineBanner';
import Onboarding from './FrontendJSX/Onboarding';
import OrbitLoader from './FrontendJSX/OrbitLoader';
import Results from './FrontendJSX/Results';
import Simulator from './FrontendJSX/Simulator';
import SwipeGame from './FrontendJSX/SwipeGame';

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

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
        if (!isActive) return;

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

        if (!isActive) return;
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

  return (
    <ToastProvider>
      {/* Available globally on every route */}
      <OfflineBanner />

      <Router>
        <div className="App">
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
                  ? <Results />
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
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import { onIdTokenChanged } from 'firebase/auth';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { auth } from './BackendFbase/Firebase';
import { ToastProvider } from './context/ToastContext';
import CareerLibrary from './FrontendJSX/CareerLibrary';
import Home from './FrontendJSX/Home';
import InterestAssessmentQuiz from './FrontendJSX/InterestAssessmentQuiz';
import LoginRegister from './FrontendJSX/LoginRegister';
import OfflineBanner from './FrontendJSX/OfflineBanner';
import OrbitLoader from './FrontendJSX/OrbitLoader';
import Results from './FrontendJSX/Results';
import Simulator from './FrontendJSX/Simulator';
import SwipeGame from './FrontendJSX/SwipeGame';

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const theme = storedTheme === 'dark'
      ? 'dark'
      : 'light';

    document.documentElement.setAttribute(
      'data-theme',
      theme,
    );

    document.body.setAttribute(
      'data-theme',
      theme,
    );
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      (currentUser) => {
        /*
         * Registration creates a signed-in user before
         * email verification. Keep unverified users on
         * the login page.
         */
        const verifiedUser =
          currentUser?.emailVerified === true
            ? currentUser
            : null;

        setUser(verifiedUser);
        setAuthReady(true);
      },
    );

    return unsubscribe;
  }, []);

  if (!authReady) {
    return (
      <div className="app-session-loader">
        <OfflineBanner />

        <OrbitLoader label="Restoring your session" />
      </div>
    );
  }

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
                  to={user ? '/home' : '/login'}
                  replace
                />
              )}
            />

            <Route
              path="/login"
              element={
                user
                  ? <Navigate to="/home" replace />
                  : <LoginRegister />
              }
            />

            <Route
              path="/home"
              element={
                user
                  ? <Home />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/library"
              element={
                user
                  ? <CareerLibrary />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/results"
              element={
                user
                  ? <Results />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/who-am-i"
              element={
                user
                  ? <InterestAssessmentQuiz />
                  : <Navigate to="/login" replace />
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
                user
                  ? <SwipeGame />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/day-in-the-life"
              element={
                user
                  ? <Simulator />
                  : <Navigate to="/login" replace />
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
import './App.css';

import {
  useEffect,
  useState,
} from 'react';

import { onAuthStateChanged } from 'firebase/auth';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { auth } from './BackendFbase/Firebase';
import { ToastProvider } from './context/ToastContext';
import Home from './FrontendJSX/Home';
import InterestAssessmentQuiz from './FrontendJSX/InterestAssessmentQuiz';
import LoginRegister from './FrontendJSX/LoginRegister';
import Results from './FrontendJSX/Results';

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const theme = storedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          color: '#4f46e5',
        }}
      >
        Restoring your session...
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
            <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginRegister />} />
            <Route path="/home" element={user ? <Home /> : <Navigate to="/login" replace />} />
            <Route path="/results" element={user ? <Results /> : <Navigate to="/login" replace />} />
            <Route path="/quiz" element={user ? <InterestAssessmentQuiz /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
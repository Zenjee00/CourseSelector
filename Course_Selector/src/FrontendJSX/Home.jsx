import '../FrontendCSS/Home.css';

import {
  useEffect,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { getUserSavedPrograms } from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchSavedPrograms(currentUser.uid);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    const fetchSavedPrograms = async (userId) => {
        setLoadingPrograms(true);
        try {
            const programs = await getUserSavedPrograms(userId);
            setSavedPrograms(programs);
        } catch (error) {
            console.error('Error fetching programs:', error);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const handleStartQuiz = () => navigate('/quiz');
    
    // Function to navigate to the Results page
    const handleViewResults = () => {
        if (savedPrograms.length > 0) {
            navigate('/results');
        } else {
            alert('No saved results found. Please take the quiz first!');
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleLogoutConfirm = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setShowLogoutConfirm(false);
        }
    };

    const handleOpenLogout = () => setShowLogoutConfirm(true);
    const handleCloseLogout = () => setShowLogoutConfirm(false);

    return (
        <div className="home-container">
            <nav className="home-navbar">
                <div className="nav-brand">
                    <h2 className="logo">Course<span>Selector</span></h2>
                </div>
                <div className="user-section">
                    <div className="divider-v"></div>
                    <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle theme">
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <span className="user-email">{user?.email}</span>
                    <button onClick={handleOpenLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="home-content">
                <header className="hero-section">
                    <h1>Start Your <span>Dream Course</span></h1>
                    <p>Discover the right path for your future career.</p>
                </header>

                {/* ACTION CARDS - ROW LAYOUT */}
                <div className="action-cards-row">
                    <div className="card quiz-card">
                        <div className="card-icon">📝</div>
                        <h3>Interest Quiz</h3>
                        <p>Begin the assessment to receive your personalized recommendations.</p>
                        <button onClick={handleStartQuiz} className="card-btn primary">
                            Start Quiz
                        </button>
                    </div>

                    <div className="card history-card">
                        <div className="card-icon">💾</div>
                        <h3>Saved History</h3>
                        <p>View and manage your previous assessment results.</p>
                        <button 
                            onClick={handleViewResults} 
                            className="card-btn secondary"
                            disabled={savedPrograms.length === 0}
                        >
                            View Results ({savedPrograms.length})
                        </button>
                    </div>
                </div>
            </div>

            {showLogoutConfirm && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <h3>Log out?</h3>
                        <p className="modal-text">You will be signed out of CourseSelector.</p>
                        <div className="modal-actions">
                            <button className="modal-btn ghost" onClick={handleCloseLogout}>Cancel</button>
                            <button className="modal-btn danger" onClick={handleLogoutConfirm}>Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
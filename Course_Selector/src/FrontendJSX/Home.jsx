import '../FrontendCSS/Home.css';

import {
  useEffect,
  useState,
} from 'react';

import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import {
  auth,
  db,
} from '../BackendFbase/Firebase';

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);

    useEffect(() => {
        // Listen for authentication state changes
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

    const fetchSavedPrograms = async (userId) => {
        setLoadingPrograms(true);
        try {
            const q = query(
                collection(db, 'Programs'), 
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const programs = [];
            querySnapshot.forEach((doc) => {
                programs.push({ id: doc.id, ...doc.data() });
            });
            setSavedPrograms(programs);
            console.log('Saved programs:', programs);
        } catch (error) {
            console.error('Error fetching programs:', error);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const handleStartQuiz = () => {
        navigate('/quiz');
    };

    const handleViewRecommendations = () => {
        if (savedPrograms.length > 0) {
            navigate('/results');
        } else {
            alert('No saved recommendations yet. Take the quiz first!');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('User logged out');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="home-container">
            <nav className="home-navbar">
                <h2 className="logo">Course Selector</h2>
                <div className="user-section">
                    <span className="user-email">{user?.email}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="home-content">
                <h1>Welcome to the Course Selector</h1>
                <p>Discover the best courses based on your interests and goals.</p>

                <div className="action-cards">
                    <div className="card">
                        <div className="card-icon">📝</div>
                        <h3>Interest Assessment Quiz</h3>
                        <p>Take our quiz to find courses that match your interests and strengths.</p>
                        <button onClick={handleStartQuiz} className="card-btn primary">
                            Start Quiz
                        </button>
                    </div>

                    <div className="card">
                        <div className="card-icon">💾</div>
                        <h3>Saved Recommendations</h3>
                        <p>View your previously saved course recommendations and results.</p>
                        {loadingPrograms ? (
                            <p style={{ fontSize: '14px', color: '#666' }}>Loading...</p>
                        ) : (
                            <p style={{ fontSize: '14px', color: '#667eea', fontWeight: 'bold' }}>
                                {savedPrograms.length} saved {savedPrograms.length === 1 ? 'recommendation' : 'recommendations'}
                            </p>
                        )}
                        <button onClick={handleViewRecommendations} className="card-btn secondary">
                            View Recommendations
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
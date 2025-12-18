import '../FrontendCSS/Home.css';

import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState({ email: 'user@example.com' }); // Replace with actual user data from Firebase

    const handleStartQuiz = () => {
        navigate('/quiz');
    };

    const handleViewRecommendations = () => {
        navigate('/results');
    };

    const handleLogout = () => {
        // Add Firebase logout logic here
        console.log('User logged out');
        // Clear user state or Firebase auth
        setUser(null);
        navigate('/login');
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
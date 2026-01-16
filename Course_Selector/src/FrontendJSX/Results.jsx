import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../FrontendCSS/Results.css';
import { getUserSavedPrograms } from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';

function Results() {
    const navigate = useNavigate();
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (!auth.currentUser) {
                navigate('/login');
                return;
            }
            try {
                const programs = await getUserSavedPrograms(auth.currentUser.uid);
                setSavedPrograms(programs.sort((a, b) => b.timestamp - a.timestamp));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [navigate]);

    return (
        <div className="results-page-wrapper">
            <div className="results-container">
                <header className="results-header">
                    <button onClick={() => navigate('/home')} className="back-btn">
                        ← Back to Dashboard
                    </button>
                    <h1>History</h1>
                    <p style={{ color: '#64748b', fontWeight: '500' }}>
                        Your personalized career path records.
                    </p>
                </header>

                {loading ? (
                    <div className="loading" style={{textAlign: 'center', padding: '3rem', color: '#6366f1', fontWeight: '700'}}>
                        ✨ Optimizing your records...
                    </div>
                ) : (
                    <div className="results-grid-full">
                        {savedPrograms.length > 0 ? (
                            savedPrograms.map((program, index) => (
                                <div key={program.id || index} className="detailed-card">
                                    <div className="card-top">
                                        <span className="count">RECORD #{savedPrograms.length - index}</span>
                                        <div className="score-box">
                                            Score: <b>{program.Score}</b>
                                        </div>
                                    </div>
                                    
                                    <h3>{program.User_Program}</h3>
                                    
                                    <div className="card-mid">
                                        <p style={{fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.5px', marginBottom: '12px', textTransform: 'uppercase'}}>
                                            Recommended Courses
                                        </p>
                                        <div className="tags">
                                            {program.recommendedPrograms?.map((p, i) => (
                                                <span key={i} className="tag">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="card-bottom">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        {program.timestamp && new Date(program.timestamp.toDate()).toLocaleString('en-US', {
                                            month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{textAlign: 'center', padding: '4rem', color: '#94a3b8'}}>
                                <p>No records found yet. Start your journey today!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Results;
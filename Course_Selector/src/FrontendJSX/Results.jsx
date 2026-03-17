import '../FrontendCSS/Results.css';

import React, {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  deleteUserProgram,
  getUserSavedPrograms,
} from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';
import { universities } from '../data/universities';

function Results() {
    const navigate = useNavigate();
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const getUniversitiesForProgram = (programName) => {
        if (!programName) return [];
        return universities.filter((university) => university.programs.includes(programName));
    };

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

    const handleDelete = async (programId) => {
        if (!programId) return;
        const confirmed = window.confirm('Delete this record?');
        if (!confirmed) return;
        try {
            setDeletingId(programId);
            await deleteUserProgram(programId, auth.currentUser?.uid);
            setSavedPrograms((prev) => prev.filter((p) => p.id !== programId));
        } catch (err) {
            console.error(err);
            alert('Could not delete this history item.');
        } finally {
            setDeletingId(null);
        }
    };

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
                            savedPrograms.map((program, index) => {
                                const primary = program.recommendedPrograms?.[0];
                                const suggestions = program.recommendedPrograms?.slice(1) || [];
                                return (
                                    <div key={program.id || index} className="detailed-card">
                                        <div className="card-top">
                                            <span className="count">RECORD #{savedPrograms.length - index}</span>
                                            <div className="score-box">
                                                Score: <b>{program.Score}</b>
                                            </div>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(program.id)}
                                                disabled={deletingId === program.id}
                                            >
                                                {deletingId === program.id ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </div>
                                        
                                        <h3>{program.Recommended_Field || 'Recommended Program'}</h3>

                                        <div className="card-mid">
                                            {primary && (
                                                <div className="primary-rec">
                                                    <p className="label">Recommended Program</p>
                                                    <span className="tag primary-tag">{primary}</span>
                                                    <div className="program-universities">
                                                        <p className="program-label">Recommended Schools</p>
                                                        {getUniversitiesForProgram(primary).length > 0 ? (
                                                            <ul className="university-list">
                                                                {getUniversitiesForProgram(primary).map((school) => (
                                                                    <li key={`${primary}-${school.name}`}>
                                                                        <span className="school-name">{school.name}</span>
                                                                        <span className="school-location">{school.location}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="no-schools">No school matches yet.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {suggestions.length > 0 && (
                                                <div className="suggestions">
                                                    <p className="label">Other Suggestions</p>
                                                    <div className="tags">
                                                        {suggestions.map((p, i) => (
                                                            <span key={i} className="tag">{p}</span>
                                                        ))}
                                                    </div>
                                                    <div className="program-universities">
                                                        <p className="program-label">Recommended Schools per Suggestion</p>
                                                        {suggestions.map((programName) => (
                                                            <div key={`schools-${programName}`} className="suggestion-schools">
                                                                <span className="suggestion-name">{programName}</span>
                                                                {getUniversitiesForProgram(programName).length > 0 ? (
                                                                    <ul className="university-list">
                                                                        {getUniversitiesForProgram(programName).map((school) => (
                                                                            <li key={`${programName}-${school.name}`}>
                                                                                <span className="school-name">{school.name}</span>
                                                                                <span className="school-location">{school.location}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="no-schools">No school matches yet.</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                                );
                            })
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
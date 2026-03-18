import '../FrontendCSS/Home.css';

import {
  useEffect,
  useState,
} from 'react';

import confetti from 'canvas-confetti';
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { getUserSavedPrograms } from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';
import { useToast } from '../context/ToastContext';
import folderIcon from '../Photos/Folder.png';

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        displayName: '',
        photoURL: '',
        newPassword: '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const showToast = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setProfileForm({
                    displayName: currentUser.displayName || '',
                    photoURL: currentUser.photoURL || '',
                    newPassword: '',
                });
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

    const handleStartQuiz = () => {
        setMobileMenuOpen(false);
        navigate('/quiz');
    };
    
    // Function to navigate to the Results page
    const handleViewResults = () => {
        if (savedPrograms.length > 0) {
            setMobileMenuOpen(false);
            navigate('/results');
        } else {
            showToast('No saved results found. Please take the quiz first.', 'warning');
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleLogoConfetti = () => {
        const confettiConfig = {
            particleCount: 150,
            spread: 120,
            startVelocity: 55,
            gravity: 0.95,
            scalar: 0.9,
            ticks: 200
        };

        confetti({ ...confettiConfig, origin: { x: 0.5, y: 0.3 } });
    };

    const handleLogoutConfirm = async () => {
        try {
            await signOut(auth);
            showToast('You have been logged out.', 'success');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Logout failed. Please try again.', 'error');
        } finally {
            setShowLogoutConfirm(false);
            setMobileMenuOpen(false);
        }
    };

    const handleOpenLogout = () => setShowLogoutConfirm(true);
    const handleCloseLogout = () => setShowLogoutConfirm(false);

    const handleOpenProfile = () => {
        setShowProfileModal(true);
        setMobileMenuOpen(false);
    };

    const handleCloseProfile = () => {
        setShowProfileModal(false);
        setProfileForm((prev) => ({ ...prev, newPassword: '' }));
    };

    const handleProfileChange = (field, value) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        if (!user) return;
        setIsSavingProfile(true);

        try {
            if (profileForm.displayName !== user.displayName || profileForm.photoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName: profileForm.displayName,
                    photoURL: profileForm.photoURL,
                });
                showToast('Profile updated successfully.', 'success');
            }

            if (profileForm.newPassword) {
                if (profileForm.newPassword.length < 6) {
                    showToast('Password should be at least 6 characters.', 'warning');
                } else {
                    await updatePassword(user, profileForm.newPassword);
                    showToast('Password changed successfully.', 'success');
                }
            }

            setShowProfileModal(false);
            setProfileForm((prev) => ({ ...prev, newPassword: '' }));
        } catch (error) {
            console.error('Profile update error:', error);
            showToast(error.message || 'Unable to update profile.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleKeyClose = (event, handler) => {
        if (event.key === 'Escape') {
            handler();
        }
    };

    const handleToggleSettings = () => setSettingsOpen((prev) => !prev);
    const closeSettings = () => setSettingsOpen(false);

    const displayName = user?.displayName || user?.email || 'User';
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const avatarSrc = user?.photoURL || '';

    return (
        <div className="home-container">
            <nav className="home-navbar" role="navigation" aria-label="Primary">
                <div className="nav-brand" aria-label="CourseSelector home">
                    <h2 className="logo" onClick={handleLogoConfetti}>Course<span>Selector</span></h2>
                </div>

                <button
                    className={`menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`user-section ${mobileMenuOpen ? 'visible' : ''}`}>
                    <button
                        className="nav-icon-btn saved-btn"
                        onClick={handleViewResults}
                        aria-label={`Saved history (${savedPrograms.length})`}
                        disabled={savedPrograms.length === 0}
                    >
                        <img src={folderIcon} alt="Saved history" />
                        <span className="saved-count">{savedPrograms.length}</span>
                    </button>
                    <button className="profile-chip" onClick={handleOpenProfile} aria-label="View profile">
                        <span className="avatar-circle" aria-hidden="true">
                            {avatarSrc ? <img src={avatarSrc} alt="" /> : avatarLetter}
                        </span>
                        <span className="user-email">{displayName}</span>
                    </button>
                    <div className="settings-wrapper">
                        <button
                            className={`settings-btn ${settingsOpen ? 'open' : ''}`}
                            aria-label="Open settings menu"
                            aria-expanded={settingsOpen}
                            onClick={handleToggleSettings}
                        >
                            <span className="gear-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20.2 9.5h-1.23a.7.7 0 0 1-.66-.48l-.29-.86a.7.7 0 0 1 .16-.71l.87-.87a1 1 0 0 0 0-1.41l-1.43-1.43a1 1 0 0 0-1.41 0l-.87.87a.7.7 0 0 1-.71.16l-.86-.29a.7.7 0 0 1-.48-.66V3.8a1 1 0 0 0-1-1h-2.02a1 1 0 0 0-1 1v1.23a.7.7 0 0 1-.48.66l-.86.29a.7.7 0 0 1-.71-.16l-.87-.87a1 1 0 0 0-1.41 0L4.35 6.38a1 1 0 0 0 0 1.41l.87.87a.7.7 0 0 1 .16.71l-.29.86a.7.7 0 0 1-.66.48H3.2a1 1 0 0 0-1 1v2.02a1 1 0 0 0 1 1h1.23a.7.7 0 0 1 .66.48l.29.86a.7.7 0 0 1-.16.71l-.87.87a1 1 0 0 0 0 1.41l1.43 1.43a1 1 0 0 0 1.41 0l.87-.87a.7.7 0 0 1 .71-.16l.86.29c.3.1.5.38.48.7v1.23a1 1 0 0 0 1 1h2.02a1 1 0 0 0 1-1v-1.23a.7.7 0 0 1 .48-.66l.86-.29a.7.7 0 0 1 .71.16l.87.87a1 1 0 0 0 1.41 0l1.43-1.43a1 1 0 0 0 0-1.41l-.87-.87a.7.7 0 0 1-.16-.71l.29-.86a.7.7 0 0 1 .66-.48h1.23a1 1 0 0 0 1-1V10.5a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </button>

                        {settingsOpen && (
                            <div className="settings-menu" role="menu" aria-label="Settings menu">
                                <button className="settings-item" onClick={() => { toggleTheme(); closeSettings(); }} role="menuitem">
                                    <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                                    <span>{theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}</span>
                                </button>
                                <button className="settings-item danger" onClick={() => { handleOpenLogout(); closeSettings(); }} role="menuitem">
                                    <span>🚪</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
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
                        <button onClick={handleStartQuiz} className="card-btn primary" aria-label="Start the interest quiz">
                            Start Quiz
                        </button>
                    </div>
                </div>
            </div>

            {showProfileModal && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="profile-modal-title"
                    onKeyDown={(e) => handleKeyClose(e, handleCloseProfile)}
                    tabIndex={-1}
                >
                    <div className="modal-card profile-modal">
                        <div className="profile-header">
                            <div className="avatar-preview" aria-hidden="true">
                                {profileForm.photoURL ? (
                                    <img src={profileForm.photoURL} alt="Profile" />
                                ) : (
                                    <span>{(profileForm.displayName || user?.email || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h3 id="profile-modal-title">Profile</h3>
                                <p className="modal-text">Update your details or change your password.</p>
                            </div>
                        </div>

                        <form className="profile-form" onSubmit={handleProfileSave}>
                            <label className="form-control">
                                <span>Name</span>
                                <input
                                    type="text"
                                    value={profileForm.displayName}
                                    onChange={(e) => handleProfileChange('displayName', e.target.value)}
                                    placeholder="Your name"
                                    aria-label="Name"
                                />
                            </label>

                            <label className="form-control">
                                <span>Photo URL</span>
                                <input
                                    type="url"
                                    value={profileForm.photoURL}
                                    onChange={(e) => handleProfileChange('photoURL', e.target.value)}
                                    placeholder="Link to your photo"
                                    aria-label="Photo URL"
                                />
                            </label>

                            <label className="form-control">
                                <span>Email</span>
                                <input type="email" value={user?.email || ''} disabled aria-label="Email address" />
                            </label>

                            <label className="form-control">
                                <span>New Password</span>
                                <input
                                    type="password"
                                    value={profileForm.newPassword}
                                    onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                                    placeholder="Enter new password"
                                    aria-label="New password"
                                />
                                <small>Leave blank to keep your current password.</small>
                            </label>

                            <div className="modal-actions">
                                <button type="button" className="modal-btn ghost" onClick={handleCloseProfile} aria-label="Cancel profile edits">Cancel</button>
                                <button type="submit" className="modal-btn primary" disabled={isSavingProfile} aria-label="Save profile">
                                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showLogoutConfirm && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="logout-modal-title"
                    onKeyDown={(e) => handleKeyClose(e, handleCloseLogout)}
                    tabIndex={-1}
                >
                    <div className="modal-card">
                        <h3 id="logout-modal-title">Log out?</h3>
                        <p className="modal-text">You will be signed out of CourseSelector.</p>
                        <div className="modal-actions">
                            <button className="modal-btn ghost" onClick={handleCloseLogout} aria-label="Cancel logout">Cancel</button>
                            <button className="modal-btn danger" onClick={handleLogoutConfirm} aria-label="Confirm logout">Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
import '../FrontendCSS/Home.css';

import {
  useEffect,
  useState,
} from 'react';

import confetti from 'canvas-confetti';
import {
  deleteUser,
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import folderIcon from '../assets/Photos/Folder.png';
import { getUserSavedPrograms } from '../BackendFbase/courseRecommendations';
import {
  auth,
  db,
} from '../BackendFbase/Firebase';
import { useToast } from '../context/ToastContext';

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showGuestLoginPrompt, setShowGuestLoginPrompt] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeletePhrasePrompt, setShowDeletePhrasePrompt] = useState(false);
    const [deletePhrase, setDeletePhrase] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
                const accountTheme = localStorage.getItem(`theme:${currentUser.uid}`);
                if (accountTheme === 'dark' || accountTheme === 'light') {
                    setTheme(accountTheme);
                }
                setProfileForm({
                    displayName: currentUser.displayName || '',
                    photoURL: currentUser.photoURL || '',
                    newPassword: '',
                });
                fetchSavedPrograms(currentUser.uid);
            } else {
                setUser(null);
                setSavedPrograms([]);
            }
            setIsInitialLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (user?.uid) localStorage.setItem(`theme:${user.uid}`, theme);
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
    }, [theme, user?.uid]);

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

    const handleStartWhoAmI = () => {
        setMobileMenuOpen(false);
        navigate('/who-am-i');
    };

    const handleStartMode = (path) => {
        setMobileMenuOpen(false);
        navigate(path);
    };
    
    // Function to navigate to the Results page
    const handleViewResults = () => {
        if (!user) {
            showToast('Sign in to save and view your history.', 'warning');
            return;
        }
        if (savedPrograms.length > 0) {
            setMobileMenuOpen(false);
            navigate('/results');
        } else {
            showToast('No saved results found. Please take the quiz first.', 'warning');
        }
    };

    const handleViewLibrary = () => {
        setMobileMenuOpen(false);
        navigate('/library');
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

    const handleProfileChipClick = () => {
        if (!user) {
            setShowGuestLoginPrompt(true);
            setMobileMenuOpen(false);
            return;
        }
        handleOpenProfile();
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

    const handleDeleteAccountRequest = () => {
        setShowProfileModal(false);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setDeletePhrase('');
        setDeleteError('');
        setShowDeletePhrasePrompt(true);
    };

    const handleDeleteAccount = async (event) => {
        event.preventDefault();
        if (deletePhrase !== 'CONFIRM') {
            setDeleteError('Type CONFIRM exactly to permanently delete your account.');
            return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
            navigate('/login', { replace: true });
            return;
        }

        setIsDeletingAccount(true);
        setDeleteError('');
        try {
            const resultsSnapshot = await getDocs(query(
                collection(db, 'Programs'),
                where('userId', '==', currentUser.uid),
            ));
            await Promise.all(resultsSnapshot.docs.map((result) => deleteDoc(result.ref)));
            await deleteDoc(doc(db, 'Users', currentUser.uid));
            await deleteUser(currentUser);
            setShowDeletePhrasePrompt(false);
            showToast('Your account has been permanently deleted.', 'success');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Account deletion error:', error);
            setDeleteError(error.code === 'auth/requires-recent-login'
                ? 'For security, sign in again before deleting your account.'
                : error.message || 'Unable to delete your account. Please try again.');
        } finally {
            setIsDeletingAccount(false);
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

    // Skeleton Loader Component
    const SkeletonLoader = () => (
        <div className="home-container skeleton-container">
            <nav className="home-navbar">
                <div className="nav-brand">
                    <div className="skeleton-logo"></div>
                </div>
                <div className="user-section visible" style={{ display: 'flex' }}>
                    <div className="skeleton-icon" style={{ width: '40px', height: '40px' }}></div>
                    <div className="skeleton-chip" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'var(--primary-soft)', borderRadius: '100px' }}>
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-text" style={{ width: '80px', height: '14px' }}></div>
                    </div>
                    <div className="skeleton-icon" style={{ width: '32px', height: '32px' }}></div>
                </div>
            </nav>

            <div className="home-content">
                <header className="hero-section">
                    <div className="skeleton-text" style={{ width: '60%', height: '48px', margin: '0 auto 16px', borderRadius: '12px' }}></div>
                    <div className="skeleton-text" style={{ width: '40%', height: '20px', margin: '0 auto', borderRadius: '8px' }}></div>
                </header>

                <div className="action-cards-row">
                    <div className="card quiz-card" style={{ cursor: 'default' }}>
                        <div className="skeleton-icon-large" style={{ width: '64px', height: '64px', margin: '0 auto 24px', borderRadius: '16px' }}></div>
                        <div className="skeleton-text" style={{ width: '50%', height: '24px', margin: '0 auto 16px' }}></div>
                        <div className="skeleton-text" style={{ width: '80%', height: '14px', margin: '0 auto 24px' }}></div>
                        <div className="skeleton-button"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isInitialLoading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="home-container">
            <nav className="home-navbar" role="navigation" aria-label="Primary">
                <div className="nav-brand" aria-label="Academira home">
                    <h2 className="logo" onClick={handleLogoConfetti}>Acade<span>mira</span></h2>
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
                        disabled={!user || loadingPrograms || savedPrograms.length === 0}
                    >
                        <img src={folderIcon} alt="Saved history" />
                        {loadingPrograms ? (
                            <span className="skeleton-circle"></span>
                        ) : (
                            <span className="saved-count">{savedPrograms.length}</span>
                        )}
                    </button>
                    <button className="nav-icon-btn library-btn" onClick={handleViewLibrary} aria-label="Open career library">
                        <span aria-hidden="true">📚</span>
                        <span className="library-btn-label">Library</span>
                    </button>
                    <button
                        className="profile-chip"
                        onClick={handleProfileChipClick}
                        aria-label={user ? 'View profile' : 'Sign in'}
                    >
                        <span className="avatar-circle" aria-hidden="true">
                            {avatarSrc ? <img src={avatarSrc} alt="" /> : avatarLetter}
                        </span>
                        <span className="user-email">{user ? displayName : 'Guest'}</span>
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
                                <button className="settings-item danger" onClick={() => { (user ? handleOpenLogout : () => navigate('/login'))(); closeSettings(); }} role="menuitem">
                                    <span>🚪</span>
                                    <span>{user ? 'Logout' : 'Sign in'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="home-content">
                <header className="hero-section">
                    <p className="hero-eyebrow">ACADEMIC PATHFINDER</p>
                    <h1>Start Your <span>Dream Course</span></h1>
                    <p>Discover the right path for your future career.</p>
                </header>

                <section className="home-status-rail" aria-label="Academira overview">
                    <div className="status-pill">
                        <span className="status-dot" aria-hidden="true"></span>
                        <span><strong>{savedPrograms.length}</strong> saved {savedPrograms.length === 1 ? 'result' : 'results'}</span>
                    </div>
                    <div className="status-pill">
                        <span className="status-icon" aria-hidden="true">◎</span>
                        <span>Personalized course discovery</span>
                    </div>
                    <div className="status-pill status-pill-accent">
                        <span className="status-icon" aria-hidden="true">✦</span>
                        <span>Explore with confidence</span>
                    </div>
                </section>

                {/* ACTION CARDS - ROW LAYOUT */}
                <div className="action-cards-row mode-cards-row">
                    <div className="card quiz-card mode-card">
                        <span className="card-badge">RECOMMENDED START</span>
                        <div className="card-icon">📝</div>
                        <h3>Who am I</h3>
                        <p>Discover your strongest interests and receive personalized course recommendations.</p>
                        <button onClick={handleStartWhoAmI} className="card-btn primary" aria-label="Start Who am I">
                            Start Who am I
                        </button>
                    </div>
                    <div className="card mode-card">
                        <span className="card-badge">DISCOVER</span>
                        <div className="card-icon">💫</div>
                        <h3>Swipe Match</h3>
                        <p>Swipe through work values, environments, and everyday activities.</p>
                        <button onClick={() => handleStartMode('/swipe-match')} className="card-btn primary" aria-label="Open Swipe Match">
                            Explore Mode
                        </button>
                    </div>
                    <div className="card mode-card">
                        <span className="card-badge">PRACTICE</span>
                        <div className="card-icon">🎬</div>
                        <h3>Day in a Life</h3>
                        <p>Respond to real-world career scenarios and workplace challenges.</p>
                        <button onClick={() => handleStartMode('/day-in-the-life')} className="card-btn primary" aria-label="Open Day in the Life">
                            Explore Mode
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
                            <button type="button" className="delete-account-link" onClick={handleDeleteAccountRequest}>
                                Delete Account
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showGuestLoginPrompt && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="guest-login-title"
                    onKeyDown={(e) => handleKeyClose(e, () => setShowGuestLoginPrompt(false))}
                    tabIndex={-1}
                >
                    <div className="modal-card">
                        <h3 id="guest-login-title">Log in to your account?</h3>
                        <p className="modal-text">You are browsing as a guest. Log in to access your profile, saved history, and account features.</p>
                        <div className="modal-actions">
                            <button className="modal-btn ghost" onClick={() => setShowGuestLoginPrompt(false)}>Continue as guest</button>
                            <button className="modal-btn primary" onClick={() => navigate('/login')}>Log in</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-account-title"
                    onKeyDown={(e) => handleKeyClose(e, () => setShowDeleteConfirm(false))}
                    tabIndex={-1}
                >
                    <div className="modal-card">
                        <h3 id="delete-account-title">Delete your account?</h3>
                        <p className="modal-text">This permanently removes your profile and saved history. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="modal-btn ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="modal-btn danger" onClick={handleDeleteConfirm}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeletePhrasePrompt && (
                <div
                    className="modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-confirm-title"
                    onKeyDown={(e) => handleKeyClose(e, () => setShowDeletePhrasePrompt(false))}
                    tabIndex={-1}
                >
                    <div className="modal-card delete-confirm-modal">
                        <h3 id="delete-confirm-title">Permanently delete account</h3>
                        <p className="modal-text">Type <strong>CONFIRM</strong> to permanently delete your account and saved data.</p>
                        <form onSubmit={handleDeleteAccount}>
                            <label className="delete-confirm-label" htmlFor="delete-confirm-input">Confirmation</label>
                            <input
                                id="delete-confirm-input"
                                className="delete-confirm-input"
                                value={deletePhrase}
                                onChange={(event) => setDeletePhrase(event.target.value)}
                                autoComplete="off"
                                autoFocus
                            />
                            {deleteError && <p className="delete-confirm-error" role="alert">{deleteError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="modal-btn ghost" onClick={() => setShowDeletePhrasePrompt(false)} disabled={isDeletingAccount}>Cancel</button>
                                <button type="submit" className="modal-btn danger" disabled={isDeletingAccount || deletePhrase !== 'CONFIRM'}>
                                    {isDeletingAccount ? 'Deleting...' : 'Delete permanently'}
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
                        <p className="modal-text">You will be signed out of Academira.</p>
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
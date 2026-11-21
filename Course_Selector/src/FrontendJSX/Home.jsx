import '../FrontendCSS/Home.css';

import {
  useEffect,
  useState,
} from 'react';

import {
  deleteUser,
  getIdTokenResult,
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

import courseNFoundLogo from '../assets/Photos/CourseNFound.png';
import Icon from '../components/Icon';
import { useDialogFocus } from '../hooks/useDialogFocus';
import DiscoveryHome from '../components/DiscoveryHome';
import OrbitLoader from './OrbitLoader';
import { getUserSavedPrograms } from '../BackendFbase/courseRecommendations';
import {
  auth,
  db,
} from '../BackendFbase/Firebase';
import { useToast } from '../context/useToast';
import { useTheme } from '../context/useTheme';

function isSafePhotoUrl(value) {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const { theme, toggleTheme } = useTheme();
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

    useDialogFocus(showProfileModal ? 'profile' : showGuestLoginPrompt ? 'guest' : showDeleteConfirm ? 'delete' : showDeletePhrasePrompt ? 'confirm-delete' : showLogoutConfirm ? 'logout' : null, () => {
        setShowProfileModal(false);
        setShowGuestLoginPrompt(false);
        setShowDeleteConfirm(false);
        setShowDeletePhrasePrompt(false);
        setShowLogoutConfirm(false);
    });

    useEffect(() => {
        const fetchSavedPrograms = async (userId) => {
            setLoadingPrograms(true);
            try {
                const programs = await getUserSavedPrograms(userId);
                setSavedPrograms(programs);
            } catch (error) {
                console.error('Could not load saved assessments:', error.code);
                showToast('Could not load your history. Check your connection and refresh.', 'error');
            } finally {
                setLoadingPrograms(false);
            }
        };

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
                setUser(null);
                setSavedPrograms([]);
            }
            setIsInitialLoading(false);
        });
        return () => unsubscribe();
    }, [navigate, showToast]);

    const handleGuestSignInRequest = () => {
        setMobileMenuOpen(false);
        setSettingsOpen(false);
        setShowGuestLoginPrompt(true);
    };

    const handleViewResults = () => {
        if (!user) {
            handleGuestSignInRequest();
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
            handleGuestSignInRequest();
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
        const displayName = profileForm.displayName.trim();
        if (!displayName || displayName.length > 80) {
            showToast('Enter a name between 1 and 80 characters.', 'warning');
            return;
        }
        if (profileForm.photoURL && !isSafePhotoUrl(profileForm.photoURL)) {
            showToast('Use an HTTPS link for your profile photo.', 'warning');
            return;
        }
        if (profileForm.newPassword && profileForm.newPassword.length < 6) {
            showToast('Use at least 6 characters for your new password.', 'warning');
            return;
        }
        setIsSavingProfile(true);

        try {
            if (profileForm.displayName !== user.displayName || profileForm.photoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName,
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
            showToast(error.code === 'auth/requires-recent-login' ? 'Sign in again before changing your password.' : 'Could not update your profile. Please try again.', 'error');
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
            // Check before removing data: Firebase rejects account deletion after an old login.
            const token = await getIdTokenResult(currentUser, true);
            if (Date.now() / 1000 - Number(token.claims.auth_time || 0) > 300) {
                setDeleteError('Sign in again before deleting your account. No data has been removed.');
                return;
            }
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
                : 'Unable to finish deleting your account. Please try again.');
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
    const avatarSrc = isSafePhotoUrl(user?.photoURL) ? user.photoURL : '';

    if (isInitialLoading) return <OrbitLoader label="Loading your workspace" />;

    return (
        <div className="home-container">
            <a href="#main-content" className="skip-link">Skip to content</a>
            <nav className="home-navbar" role="navigation" aria-label="Primary">
                <div className="nav-brand" aria-label="CourseNFound home">
                    <a href="/home" className="brand-link"><img src={courseNFoundLogo} alt="" /><span>CourseNFound</span></a>
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
                        disabled={Boolean(user) && (loadingPrograms || savedPrograms.length === 0)}
                    >
                        <Icon name="folder" /><span>History</span>
                        {loadingPrograms ? (
                            <span className="skeleton-circle"></span>
                        ) : (
                            <span className="saved-count">{savedPrograms.length}</span>
                        )}
                    </button>
                    <button className="nav-icon-btn library-btn" onClick={handleViewLibrary} aria-label="Open career library">
                        <Icon name="book" />
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
                            <Icon name="settings" />
                        </button>

                        {settingsOpen && (
                            <div className="settings-menu" role="menu" aria-label="Settings menu">
                                <button className="settings-item" onClick={() => { toggleTheme(); closeSettings(); }} role="menuitem">
                                    <Icon name={theme === 'light' ? 'moon' : 'sun'} />
                                    <span>{theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}</span>
                                </button>
                                <button className={`settings-item${user ? ' danger' : ''}`} onClick={() => { (user ? handleOpenLogout : handleGuestSignInRequest)(); closeSettings(); }} role="menuitem">

                                    <span>{user ? 'Logout' : 'Sign in'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <DiscoveryHome savedCount={savedPrograms.length} isGuest={!user} />

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
                                {isSafePhotoUrl(profileForm.photoURL) ? (
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
                        <p className="modal-text">You will be signed out of CourseNFound.</p>
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

import '../FrontendCSS/LoginRegister.css';

import {
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';

import {
  auth,
  db,
  googleProvider,
} from '../BackendFbase/Firebase';
import academiraLogo from '../assets/Photos/Academira .png';
import OrbitLoader from './OrbitLoader';

function LoginRegister() {
    const navigate = useNavigate();
    const recaptchaRef = useRef(null);
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState('Signing you in...');
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');

    const verifyRecaptcha = async () => {
        if (import.meta.env.MODE === 'test') return;
        if (!recaptchaSiteKey) {
            if (import.meta.env.PROD) {
                throw new Error('reCAPTCHA is not configured. Please contact the administrator.');
            }
            return;
        }

        if (!recaptchaToken) throw new Error('Please complete the reCAPTCHA challenge and try again.');

        const baseUrl = import.meta.env.VITE_GEO_PROXY_URL || 'http://localhost:5174';
        const response = await fetch(`${baseUrl}/api/verify-recaptcha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: recaptchaToken }),
        });
        if (!response.ok) {
            recaptchaRef.current?.reset();
            setRecaptchaToken('');
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || 'reCAPTCHA verification failed.');
        }

        recaptchaRef.current?.reset();
        setRecaptchaToken('');
    };

    // Always disconnect an unverified account, even when email delivery fails.
    const sendVerificationAndSignOut = async (user) => {
        try {
            await sendEmailVerification(user);
            setInfoMessage('Verification email sent. Check your inbox and spam folder, then log in again after verifying.');
        } catch (verificationError) {
            setError(verificationError.code === 'auth/too-many-requests'
                ? 'Too many verification requests. Use the existing email link or try again later.'
                : 'Could not send the verification email. Please log in again to retry.');
        } finally {
            await signOut(auth);
        }
    };

    const requireVerifiedUser = async (user) => {
        try {
            await reload(user);
            if (!user.emailVerified) {
                await sendVerificationAndSignOut(user);
                return false;
            }
            const token = await getIdTokenResult(user, true);
            if (token.claims.email_verified !== true) {
                throw new Error('Email verification could not be confirmed. Please log in again.');
            }
            return true;
        } catch (verificationError) {
            await signOut(auth);
            throw verificationError;
        }
    };

    const saveVerifiedProfile = async (user) => {
        const ref = doc(db, 'Users', user.uid);
        const existing = await getDoc(ref);
        const needsOnboarding = !existing.exists()
            || existing.data().onboardingCompleted !== true;
        await setDoc(ref, {
            Email: user.email,
            Name: user.displayName || '',
            PhotoURL: user.photoURL || '',
            ...(!existing.exists() ? { createdAt: new Date().toISOString() } : {}),
            ...(existing.exists() ? {} : { onboardingCompleted: false }),
            lastLogin: new Date().toISOString(),
        }, { merge: true });
        return needsOnboarding;
    };

    const SkeletonLoader = () => (
        <div className="login-register-container">
            <div className="form-wrapper auth-loading">
                <OrbitLoader label={loadingLabel} />
            </div>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMessage('');
        setLoadingLabel(isLogin ? 'Signing you in...' : 'Creating your account...');
        setLoading(true);
        
        try {
            if (isLogin) await verifyRecaptcha();
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (!await requireVerifiedUser(userCredential.user)) return;
                const needsOnboarding = await saveVerifiedProfile(userCredential.user);

                console.log('Login successful!');
                navigate(needsOnboarding ? '/onboarding' : '/home', { replace: true });
            } else {
                // Register logic
                if (password !== confirmPassword) {
                    setError('Passwords do not match!');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters long');
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Profile creation is deferred until the first verified login.
                await sendVerificationAndSignOut(userCredential.user);
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setShowPassword(false);

            }
        } catch (error) {
            console.error('Authentication error:', error);
            // Handle specific Firebase errors
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError('This email is already registered');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address');
                    break;
                case 'auth/weak-password':
                    setError('Password is too weak');
                    break;
                case 'auth/user-not-found':
                    setError('No account found with this email');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password');
                    break;
                case 'auth/operation-not-allowed':
                    setError('Email/Password sign-in is disabled in Firebase. Enable Email/Password provider in Firebase Console > Authentication > Sign-in method.');
                    break;
                default:
                    setError(error.message || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoadingLabel('Signing in with Google...');
        setLoading(true);
        setError('');
        setInfoMessage('');
        
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            if (!await requireVerifiedUser(user)) return;
            const needsOnboarding = await saveVerifiedProfile(user);

            console.log('Google sign-in successful!');
            navigate(needsOnboarding ? '/onboarding' : '/home', { replace: true });
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled.');
            } else {
                // Show the actual error message to help debug
                setError(`Google Sign In failed: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = (nextIsLogin = !isLogin) => {
        if (nextIsLogin === isLogin) return;
        setIsLogin(nextIsLogin);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setError('');
        setInfoMessage('');
    };

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <div className="login-register-container">
            <div className={`auth-shell${isLogin ? ' is-login' : ' is-register'}`}>
                <aside className="auth-visual" aria-hidden="true">
                    <div className="auth-orb auth-orb-one" />
                    <div className="auth-orb auth-orb-two" />
                    <div className="auth-visual-content">
                        <div className="auth-brand-mark">
                            <img src={academiraLogo} alt="Academira logo" />
                        </div>
                        <p className="auth-kicker">ACADEMIRA</p>
                        <h1>{isLogin ? 'Welcome back.' : 'Start your journey.'}</h1>
                        <p>
                            {isLogin
                                ? 'Continue exploring programs, nearby schools, and career paths made for you.'
                                : 'Create an account and turn your interests into a clearer academic and career direction.'}
                        </p>
                        <div className="auth-feature-list">
                            <span>Personalized recommendations</span>
                            <span>School informations</span>
                            <span>Saved assessment history</span>
                        </div>
                    </div>
                </aside>

                <div className="form-wrapper">
                    <div className="auth-form-inner" key={isLogin ? 'login' : 'register'}>
                        <p className="form-eyebrow">{isLogin ? 'WELCOME BACK' : 'JOIN ACADEMIRA'}</p>
                        <h2>{isLogin ? 'Login' : 'Register'}</h2>
                        <p className="form-subtitle">
                            {isLogin ? 'Sign in to continue your career journey.' : 'Create your account to get started.'}
                        </p>

                        <div className={`auth-mode-switch${isLogin ? '' : ' show-register'}`} role="tablist" aria-label="Authentication mode">
                            <span className="auth-mode-indicator" aria-hidden="true" />
                            <button
                                type="button"
                                role="tab"
                                aria-selected={isLogin}
                                className={isLogin ? 'is-active' : ''}
                                onClick={() => toggleMode(true)}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!isLogin}
                                className={!isLogin ? 'is-active' : ''}
                                onClick={() => toggleMode(false)}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            {error && <div className="error-message" role="alert">{error}</div>}
                            {infoMessage && <div className="info-message" role="status">{infoMessage}</div>}

                            <div className="formField">
                                <label className="sr-only" htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder=" "
                                    autoComplete="email"
                                    required
                                />
                                <span aria-hidden="true">Email</span>
                            </div>

                            <div className="formField">
                                <label className="sr-only" htmlFor="password">Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=" "
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    required
                                />
                                <span aria-hidden="true">Password</span>
                            </div>

                            {!isLogin && (
                                <div className="formField confirm-password-group">
                                    <label className="sr-only" htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder=" "
                                        autoComplete="new-password"
                                        required
                                    />
                                    <span aria-hidden="true">Confirm Password</span>
                                </div>
                            )}

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="showPassword"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                />
                                <label htmlFor="showPassword">Show Password</label>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                <span>{loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}</span>
                                <span className="submit-arrow" aria-hidden="true">→</span>
                            </button>
                        </form>

                        <div className="divider">
                            <span>or continue with</span>
                        </div>

                        <button type="button" onClick={handleGoogleSignIn} className="google-btn" disabled={loading}>
                            <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {loading ? 'Signing in...' : 'Continue with Google'}
                        </button>

                        <div className="toggle-mode">
                            <p>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                <button type="button" onClick={() => toggleMode(!isLogin)} className="toggle-link">
                                    {isLogin ? 'Register' : 'Login'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isLogin && recaptchaSiteKey && createPortal(
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    size="invisible"
                    badge="bottomright"
                    onChange={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken('')}
                    onErrored={() => setError('Could not load reCAPTCHA. Please refresh and try again.')}
                />,
                document.body,
            )}
        </div>
    );
}

export default LoginRegister;

import '../FrontendCSS/GuestFeatureGate.css';

import { useNavigate } from 'react-router-dom';

function GuestFeatureGate({ feature }) {
    const navigate = useNavigate();

    return (
        <main className="guest-gate-page">
            <section className="guest-gate-panel" aria-labelledby="guest-gate-title">
                <h1 id="guest-gate-title">Sign in to access {feature}</h1>
                <p>
                    You can keep exploring CourseNFound as a guest. Sign in or create an account to save your history and favorites across sessions.
                </p>
                <div className="guest-gate-actions">
                    <button type="button" className="guest-gate-secondary" onClick={() => navigate('/home', { replace: true })}>
                        Continue as guest
                    </button>
                    <button type="button" onClick={() => navigate('/login')}>
                        Sign in to continue
                    </button>
                </div>
            </section>
        </main>
    );
}

export default GuestFeatureGate;

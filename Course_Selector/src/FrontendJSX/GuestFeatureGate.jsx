import '../FrontendCSS/GuestFeatureGate.css';

import { useNavigate } from 'react-router-dom';

function GuestFeatureGate({ feature }) {
    const navigate = useNavigate();

    return (
        <main className="guest-gate-page">
            <section className="guest-gate-panel" aria-labelledby="guest-gate-title">
                <p className="guest-gate-kicker">ACCOUNT FEATURE</p>
                <h1 id="guest-gate-title">Sign in to access {feature}</h1>
                <p>
                    You can keep exploring Academira as a guest. Sign in or create an account to save your history and favorites across sessions.
                </p>
                <button type="button" onClick={() => navigate('/login')}>
                    Sign in to continue <span aria-hidden="true">-&gt;</span>
                </button>
            </section>
        </main>
    );
}

export default GuestFeatureGate;

import '../FrontendCSS/GameModePlaceholder.css';

import { useNavigate } from 'react-router-dom';

function GameModePlaceholder({ title, description, icon }) {
  const navigate = useNavigate();

  return (
    <main className="mode-page">
      <section className="mode-panel" aria-labelledby="mode-title">
        <button className="mode-back-btn" onClick={() => navigate('/home')}>
          ← Back to Dashboard
        </button>
        <div className="mode-icon" aria-hidden="true">{icon}</div>
        <p className="mode-eyebrow">NEW GAME MODE</p>
        <h1 id="mode-title">{title}</h1>
        <p className="mode-description">{description}</p>
        <span className="mode-status">Coming soon</span>
      </section>
    </main>
  );
}

export default GameModePlaceholder;

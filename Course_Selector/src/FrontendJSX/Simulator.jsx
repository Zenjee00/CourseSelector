import { useNavigate } from 'react-router-dom';

function Simulator() {
	const navigate = useNavigate();

	return (
		<main style={styles.page}>
			<section style={styles.panel} aria-labelledby="day-in-life-title">
				<button type="button" style={styles.backButton} onClick={() => navigate('/home')}>
					← Back to Dashboard
				</button>
				<div style={styles.icon} aria-hidden="true">🎬</div>
				<p style={styles.eyebrow}>NEW GAME MODE</p>
				<h1 id="day-in-life-title" style={styles.title}>Day in the Life</h1>
				<p style={styles.description}>
					Step into real-world career scenarios and decide how you would respond to each challenge.
				</p>
				<span style={styles.status}>Coming soon</span>
			</section>
		</main>
	);
}

const styles = {
	page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: 'var(--bg-main, #f8fafc)', color: 'var(--text-main, #1e293b)', fontFamily: "'Plus Jakarta Sans', sans-serif" },
	panel: { width: 'min(100%, 680px)', padding: '3rem', textAlign: 'center', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '24px', background: 'var(--card-bg, #fff)', boxShadow: 'var(--shadow-lg, 0 30px 60px -12px rgba(99,102,241,.15))' },
	backButton: { display: 'block', marginBottom: '2.5rem', padding: '.7rem 1rem', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '10px', background: 'transparent', color: 'inherit', font: 'inherit', fontWeight: 700, cursor: 'pointer' },
	icon: { fontSize: '4rem', marginBottom: '1rem' },
	eyebrow: { color: 'var(--primary, #6366f1)', fontSize: '.75rem', fontWeight: 800, letterSpacing: '1.5px' },
	title: { margin: '.6rem 0 1rem', fontSize: 'clamp(2rem, 6vw, 3.5rem)' },
	description: { maxWidth: '520px', margin: '0 auto 1.5rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.7 },
	status: { display: 'inline-block', padding: '.55rem .85rem', borderRadius: '999px', background: 'var(--primary-soft, #eef2ff)', color: 'var(--primary, #6366f1)', fontSize: '.8rem', fontWeight: 800 },
};

export default Simulator;

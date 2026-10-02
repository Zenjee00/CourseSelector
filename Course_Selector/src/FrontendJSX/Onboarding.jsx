import '../FrontendCSS/Onboarding.css';

import { useState } from 'react';

import {
  doc,
  setDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import {
  auth,
  db,
} from '../BackendFbase/Firebase';

const sections = [
	{
		number: '01',
		label: 'RESPONSIBILITIES',
		title: 'Your answers shape the recommendations.',
		body: 'Academira learns about your interests, behavior, strengths, and preferences through your answers. Be honest and thoughtful so the results reflect what you really like.',
	},
	{
		number: '02',
		label: 'GOAL',
		title: 'Find a path that fits your future and budget.',
		body: 'The system looks beyond the course you prefer. It also helps you explore schools that may fit your estimated budget, location, and academic direction.',
	},
	{
		number: '03',
		label: 'LIMITATIONS',
		title: 'Use the results as a starting point.',
		body: 'Tuition data may be incomplete or change over time, and not every course has a complete roadmap yet. Recommendations are guides, not guarantees of admission or career success.',
	},
];

function Onboarding({ onComplete }) {
	const navigate = useNavigate();
	const [isSaving, setIsSaving] = useState(false);

	const handleContinue = async () => {
		if (!auth.currentUser) {
			navigate('/login', { replace: true });
			return;
		}

		setIsSaving(true);
		try {
			await setDoc(doc(db, 'Users', auth.currentUser.uid), {
				onboardingCompleted: true,
			}, { merge: true });
			onComplete();
			navigate('/home', { replace: true });
		} catch (error) {
			console.error('Could not save onboarding status:', error);
			setIsSaving(false);
		}
	};

	return (
		<main className="onboarding-page">
			<section className="onboarding-shell" aria-labelledby="onboarding-title">
				<div className="onboarding-heading">
					<p className="onboarding-kicker">A QUICK START WITH ACADEMIRA</p>
					<h1 id="onboarding-title">Before you choose, get to know your direction.</h1>
					<p className="onboarding-intro">
						A few things to keep in mind before exploring your course and school recommendations.
					</p>
				</div>

				<div className="onboarding-grid">
					{sections.map((section) => (
						<article className="onboarding-card" key={section.number}>
							<span className="onboarding-number">{section.number}</span>
							<p className="onboarding-label">{section.label}</p>
							<h2>{section.title}</h2>
							<p>{section.body}</p>
						</article>
					))}
				</div>

				<div className="onboarding-footer">
					<p>Your answers are personal. Take your time and answer what feels true to you.</p>
					<button type="button" onClick={handleContinue} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Continue to Academira'}
						<span aria-hidden="true">-&gt;</span>
					</button>
				</div>
			</section>
		</main>
	);
}

export default Onboarding;

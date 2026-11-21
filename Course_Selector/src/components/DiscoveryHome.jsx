import { Link } from 'react-router-dom';

const subjects = ['Computer & IT', 'Business', 'Health & Medical', 'Arts & Design'];

export default function DiscoveryHome({ savedCount, isGuest }) {
  return (
    <main id="main-content" className="home-content" tabIndex={-1}>
      <div className="discovery-intro">
        <h1>Your next chapter<br />starts with <em>you.</em></h1>
        <p>What do you enjoy? What could you become? Get to know your interests, then explore the courses and schools that fit.</p>
        <span className="intro-caption">A little self-discovery. A clearer direction.</span>
      </div>

      <section className="assessment-entry" aria-labelledby="assessment-title">
        <div className="assessment-heading"><span>Interest assessment</span><span>30 questions</span></div>
        <h2 id="assessment-title">Who am I?</h2>
        <p>Start with what interests you. Find your strongest fields and a selection of degree programs to explore.</p>
        <Link to="/who-am-i" className="assessment-start" aria-label="Start Who am I">Start your assessment</Link>
        <p className="assessment-note">No right or wrong answers. {isGuest ? 'No account needed to try.' : 'Your results can be saved to your history.'}</p>
        <div className="assessment-steps"><span>Reflect on your interests</span><span>Discover your fields</span><span>Explore your options</span></div>
      </section>

      <section className="library-entry" aria-labelledby="explore-title">
        <div><h2 id="explore-title">A course worth exploring.</h2><p>Browse degree programs, possible careers, and schools. Compare your options at your own pace.</p><Link to="/library" className="text-link">Browse the career library</Link></div>
        <div className="subject-index" aria-label="Explore fields">{subjects.map(subject => <Link key={subject} to={`/library?field=${encodeURIComponent(subject)}`}>{subject}<span>View programs</span></Link>)}</div>
      </section>

      <section className="upcoming-modes" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">More ways to find your direction.</h2>
        <div>
          <h3>Swipe Match</h3>
          <p>Explore work values, environments, and everyday activities.</p>
          <span>Coming soon</span>
          <Link to="/swipe-match" className="text-link upcoming-mode-link">Preview Swipe Match</Link>
        </div>
        <div>
          <h3>Day in a Life</h3>
          <p>Try decisions inspired by everyday career scenarios.</p>
          <span>Coming soon</span>
          <Link to="/day-in-the-life" className="text-link upcoming-mode-link">Preview Day in a Life</Link>
        </div>
      </section>
      <footer className="home-footer"><span>CourseNFound</span><p>{isGuest ? 'Exploring as a guest. Sign in to keep your assessment history.' : `${savedCount} saved ${savedCount === 1 ? 'assessment' : 'assessments'} in your history.`}</p><span>Choose with curiosity.</span></footer>
    </main>
  );
}

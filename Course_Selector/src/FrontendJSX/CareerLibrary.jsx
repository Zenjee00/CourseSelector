import '../FrontendCSS/CareerLibrary.css';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import CareerInfo from '../components/CareerInfo';
import { useDialogFocus } from '../hooks/useDialogFocus';

import { auth } from '../BackendFbase/Firebase';
import {
  careerPrograms,
  getCareerInfo,
  getProgramDetails,
} from '../data/careerLibrary';
import {
  getUserLocation,
  sortUniversitiesByDistance,
} from '../utils/location';
import {
  formatTuition,
  getProgramKey,
  getSchoolsForProgram,
} from '../utils/programCatalog';
import OrbitLoader from './OrbitLoader';

const categories = [
  { label: 'All programs', value: '' },
  { label: 'My Favorites', value: 'Favorites' },
  { label: 'Computer & IT', value: 'Computer' },
  { label: 'Business', value: 'Business' },
  { label: 'Health & Medical', value: 'Health' },
  { label: 'Education', value: 'Education' },
  { label: 'Social Sciences', value: 'Social' },
  { label: 'Arts & Design', value: 'Arts' },
  { label: 'Agriculture', value: 'Agriculture' },
  { label: 'Hospitality', value: 'Hospitality' },
  { label: 'Sciences', value: 'Science' },
];

function getCategory(programName) {
  if (/Computer|Information|Software|Data|Cybersecurity|Multimedia Computing|Game Development|Library and Information|Technical Communication/.test(programName)) return 'Computer';
  if (/Accountancy|Accounting|Business|Entrepreneurship|Economics|Office|Customs|Marketing|Finance|Management|Human Resource|BPO/.test(programName)) return 'Business';
  if (/Nursing|Medical|Radiologic|Pharmacy|Therapy|Nutrition|Midwifery|Public Health/.test(programName)) return 'Health';
  if (/Education|Physical Education/.test(programName)) return 'Education';
  if (/Criminology|Psychology|Political|Social|Sociology|Public Administration|International|Literature/.test(programName)) return 'Social';
  if (/Architecture|Design|Fine Arts|Multimedia Arts|Animation|Film|Fashion|Communication/.test(programName)) return 'Arts';
  if (/Agriculture|Agribusiness|Fisheries|Forestry|Environmental/.test(programName)) return 'Agriculture';
  if (/Hospitality|Hotel|Tourism|Culinary/.test(programName)) return 'Hospitality';
  return 'Science';
}

function getSchoolTuition(school) {
  const tuitionText = school.details?.tuitionFee ?? school.tuitionFee;
  if (typeof tuitionText === 'string' && tuitionText.trim()) return tuitionText;

  const tuitionData = school.details?.tuition ?? school.tuition;
  return formatTuition(tuitionData);
}

function CareerLibrary() {
  const navigate = useNavigate();
  const isGuest = !auth.currentUser;
  const favoritesKey = auth.currentUser ? `course_selector_favorites:${auth.currentUser.uid}` : null;
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(() => categories.find(item => item.label === searchParams.get('field'))?.value || '');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    if (!auth.currentUser) return [];
    try {
      const stored = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
      return Array.isArray(stored) ? stored.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });
  const [comparePrograms, setComparePrograms] = useState(() => {
    try {
      const storedPrograms = JSON.parse(localStorage.getItem('course_selector_compare') || '[]');
      return Array.isArray(storedPrograms) ? storedPrograms.filter(item => typeof item === 'string' && careerPrograms.includes(item)).slice(-1) : [];
    } catch {
      return [];
    }
  });
  const [comparisonPair, setComparisonPair] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [showFavoriteGate, setShowFavoriteGate] = useState(false);

  useDialogFocus(selectedProgram ? 'schools' : comparisonOpen ? 'comparison' : comparisonLoading ? 'loading' : showFavoriteGate ? 'favorite-gate' : null, () => {
    setSelectedProgram(null);
    setComparisonOpen(false);
    setComparisonLoading(false);
    setShowFavoriteGate(false);
  });

  useEffect(() => {
    let cancelled = false;

    getUserLocation()
      .then((coords) => {
        if (!cancelled) setUserLocation(coords);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isGuest) {
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    }
  }, [favorites, isGuest, favoritesKey]);

  useEffect(() => {
    localStorage.setItem('course_selector_compare', JSON.stringify(comparePrograms));
  }, [comparePrograms]);

  const getSortedSchoolsForProgram = (programName) => {
    const schools = getSchoolsForProgram(programName);
    return userLocation ? sortUniversitiesByDistance(schools, userLocation) : schools;
  };

  const toggleFavorite = (programName) => {
    if (isGuest) {
      setShowFavoriteGate(true);
      return;
    }
    const key = getProgramKey(programName);
    setFavorites((previous) => previous.includes(key)
      ? previous.filter((item) => item !== key)
      : [...previous, key]);
  };

  const toggleCompare = (programName) => {
    setComparePrograms((previous) => {
      if (previous.includes(programName)) return previous.filter((item) => item !== programName);
      const nextPair = previous.length >= 1 ? [previous[previous.length - 1], programName] : [programName];
      if (nextPair.length === 2) {
        setComparisonPair(nextPair);
        setComparisonLoading(true);
        window.setTimeout(() => {
          setComparisonLoading(false);
          setComparisonOpen(true);
        }, 700);
      }
      return nextPair;
    });
  };

  const closeComparison = () => {
    setComparisonOpen(false);
    setComparisonLoading(false);
    setComparisonPair([]);
    setComparePrograms([]);
  };

  const filteredPrograms = useMemo(() => careerPrograms.filter((program) => {
    const matchesSearch = program.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = category === 'Favorites'
      ? favorites.includes(getProgramKey(program))
      : !category || getCategory(program) === category;
    return matchesSearch && matchesCategory;
  }), [category, favorites, search]);

  return (
    <div className="library-page">
      <div className="library-container">
        <header className="library-header">
          <button onClick={() => navigate('/home')} className="library-back-btn">← Back to Dashboard</button>
          <h1>Courses, jobs, and starting salaries</h1>
          <p>Explore common entry-level roles and estimated monthly pay for every course in CourseNFound.</p>
        </header>

        <div className="library-controls">
          <label className="library-search brutalist-container">
            <input className="brutalist-input smooth-type" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Computer Science" />
            <span className="brutalist-label">Search courses</span>
          </label>
          <label className="library-filter">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item.value} value={item.value} disabled={isGuest && item.value === 'Favorites'}>
                  {isGuest && item.value === 'Favorites' ? 'My Favorites (Sign in required)' : item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="library-count">Showing {filteredPrograms.length} of {careerPrograms.length} programs</p>
        {isGuest && <p className="library-guest-note">Sign in to save favorite courses and access them later.</p>}
        <div className="library-grid">
          {filteredPrograms.map((program) => (
            <div className="library-card-wrapper" key={program}>
              <button
                type="button"
                className={`library-card${selectedProgram === program ? ' is-selected' : ''}`}
                onClick={() => setSelectedProgram(program)}
                aria-pressed={selectedProgram === program}
              >
                <div className="library-card-heading">
                  <h2>{program}</h2>
                  <Icon name="star" fill={favorites.includes(getProgramKey(program)) ? 'currentColor' : 'none'} />
                </div>
                <CareerInfo programName={program} showDuration={false} />
              </button>
              <div className="library-card-actions">
                <button
                  type="button"
                  onClick={() => toggleFavorite(program)}
                >
                  {favorites.includes(getProgramKey(program)) ? 'Remove favorite' : 'Favorite'}
                </button>
                <button type="button" onClick={() => toggleCompare(program)}>
                  {comparePrograms.includes(program) ? 'Remove compare' : 'Compare'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {!filteredPrograms.length && <p className="library-empty">No matching programs found.</p>}
        {selectedProgram && (
          <div
            className="library-modal-backdrop"
            role="presentation"
            onClick={() => setSelectedProgram(null)}
          >
            <section
              className="library-school-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="selected-program-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="library-school-panel-header">
                <div>
                  <span className="career-info-label">Academic Program / Degree</span>
                  <h2 id="selected-program-title">{selectedProgram}</h2>
                </div>
                <button
                  type="button"
                  className="library-close-btn"
                  onClick={() => setSelectedProgram(null)}
                  aria-label="Close school list"
                >
                  ×
                </button>
              </div>
              <div className="library-school-list">
                {getSortedSchoolsForProgram(selectedProgram).length ? (
                  getSortedSchoolsForProgram(selectedProgram).map((school) => (
                    <div className="library-school-item" key={`${selectedProgram}-${school.name}`}>
                      <div>
                        <strong>{school.name}</strong>
                        <p>{school.campus} · {school.region}</p>
                        {school.matchedProgram !== selectedProgram && (
                          <small>Related program: {school.matchedProgram}</small>
                        )}
                      </div>
                      <div className="library-school-meta">
                        <span>Tuition: {getSchoolTuition(school)}</span>
                        <span>{school.details?.duration || 'Not publicly specified'}</span>
                        <small>{school.details?.status || 'Not publicly specified'}</small>
                        {school.distance != null && <small>{Math.round(school.distance)} km away</small>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="library-empty">No school match in the current catalog.</p>
                )}
              </div>
            </section>
          </div>
        )}
        {showFavoriteGate && (
          <div
            className="library-modal-backdrop"
            role="presentation"
            onClick={() => setShowFavoriteGate(false)}
          >
            <section
              className="guest-feature-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="favorite-gate-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="library-close-btn guest-feature-modal-close"
                onClick={() => setShowFavoriteGate(false)}
                aria-label="Close sign-in prompt"
              >
                ×
              </button>
              <h2 id="favorite-gate-title">Create an account to favorite courses</h2>
              <p>Sign in or sign up to save courses and access your favorites on your next visit.</p>
              <div className="guest-feature-modal-actions">
                <button type="button" onClick={() => navigate('/login')}>
                  Sign in
                </button>
                <button type="button" onClick={() => navigate('/login', { state: { mode: 'register' } })}>
                  Sign up
                </button>
                <button type="button" onClick={() => setShowFavoriteGate(false)}>
                  Continue as guest
                </button>
              </div>
            </section>
          </div>
        )}
        {comparePrograms.length === 1 && !comparisonLoading && !comparisonOpen && (
          <p className="compare-selection-note">Select one more course to open the comparison.</p>
        )}
        {(comparisonLoading || comparisonOpen) && (
          <div className="library-modal-backdrop" role="presentation" onClick={comparisonLoading ? undefined : closeComparison}>
            {comparisonLoading ? (
              <div className="comparison-loading-panel" role="status" aria-label="Preparing comparison">
                <OrbitLoader label="Preparing comparison" />
              </div>
            ) : (
              <section
                className="comparison-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="comparison-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="comparison-modal-header">
                  <div>
                    <span className="career-info-label">Side-by-side comparison</span>
                    <h2 id="comparison-title">Compare your courses</h2>
                  </div>
                  <button type="button" className="library-close-btn" onClick={closeComparison} aria-label="Close comparison">×</button>
                </div>
                <div className="comparison-grid">
                  {comparisonPair.map((program) => {
                    const career = getCareerInfo(program);
                    const details = getProgramDetails(program);
                    const schools = getSortedSchoolsForProgram(program);
                    return (
                      <article className="comparison-column" key={program}>
                        <h3>{program}</h3>
                        <div className="comparison-fact"><span>Duration</span><strong>{details.duration}</strong></div>
                        <div className="comparison-fact"><span>Estimated salary</span><strong>{career.salary}</strong></div>
                        <div className="comparison-fact"><span>Related careers</span><p>{career.jobs.join(' • ')}</p></div>
                        <div className="comparison-fact"><span>Licensure</span><p>Not yet specified</p></div>
                        <div className="comparison-fact comparison-schools"><span>Schools offering this course</span>
                          {schools.length ? schools.map((school) => (
                            <p key={`${program}-${school.name}`}>
                              {school.name}
                              <small>{school.campus} · {school.region}</small>
                              <small>Tuition: {getSchoolTuition(school)}</small>
                            </p>
                          )) : <p>No school match in the current catalog.</p>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
        <p className="library-note">Salary figures are estimates for fresh graduates in the Philippines and vary by location, employer, skills, and licensure.</p>
      </div>
    </div>
  );
}

export default CareerLibrary;

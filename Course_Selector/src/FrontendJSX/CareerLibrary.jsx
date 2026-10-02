import '../FrontendCSS/CareerLibrary.css';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

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

function CareerInfo({ programName, showDuration = true }) {
  const { jobs, salary } = getCareerInfo(programName);
  const { duration, status } = getProgramDetails(programName);

  return (
    <div className="career-info">
      <div>
        <span className="career-info-label">Potential entry-level jobs</span>
        <p>{jobs.join(' • ')}</p>
      </div>
      <div className="career-salary">
        <span className="career-info-label">Estimated monthly salary</span>
        <strong>{salary}</strong>
      </div>
      {showDuration && (
        <div className="career-duration">
          <span className="career-info-label">Program duration</span>
          <p>{duration}</p>
          <small>{status}</small>
        </div>
      )}
    </div>
  );
}

function CareerLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('course_selector_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [comparePrograms, setComparePrograms] = useState(() => {
    try {
      const storedPrograms = JSON.parse(localStorage.getItem('course_selector_compare') || '[]');
      return Array.isArray(storedPrograms) ? storedPrograms.slice(-1) : [];
    } catch {
      return [];
    }
  });
  const [comparisonPair, setComparisonPair] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useEffect(() => {
    if (!selectedProgram && !comparisonOpen && !comparisonLoading) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedProgram(null);
        setComparisonOpen(false);
        setComparisonLoading(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedProgram, comparisonLoading, comparisonOpen]);

  useEffect(() => {
    getUserLocation()
      .then((coords) => setUserLocation(coords))
      .catch(() => setUserLocation(null));
  }, []);

  useEffect(() => {
    localStorage.setItem('course_selector_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('course_selector_compare', JSON.stringify(comparePrograms));
  }, [comparePrograms]);

  const getSortedSchoolsForProgram = (programName) => {
    const schools = getSchoolsForProgram(programName);
    return userLocation ? sortUniversitiesByDistance(schools, userLocation) : schools;
  };

  const toggleFavorite = (programName) => {
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
          <p className="library-eyebrow">CAREER LIBRARY</p>
          <h1>Courses, jobs, and starting salaries</h1>
          <p>Explore common entry-level roles and estimated monthly pay for every course in Academira.</p>
        </header>

        <div className="library-controls">
          <label className="library-search brutalist-container">
            <input className="brutalist-input smooth-type" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Computer Science" />
            <span className="brutalist-label">Search courses</span>
          </label>
          <label className="library-filter">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>

        <p className="library-count">Showing {filteredPrograms.length} of {careerPrograms.length} programs</p>
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
                  <span aria-hidden="true">{favorites.includes(getProgramKey(program)) ? '★' : '☆'}</span>
                </div>
                <CareerInfo programName={program} showDuration={false} />
              </button>
              <div className="library-card-actions">
                <button type="button" onClick={() => toggleFavorite(program)}>
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

export { CareerInfo };
export default CareerLibrary;

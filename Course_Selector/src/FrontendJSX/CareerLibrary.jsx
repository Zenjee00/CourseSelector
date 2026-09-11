import '../FrontendCSS/CareerLibrary.css';

import {
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  careerPrograms,
  getCareerInfo,
} from '../data/careerLibrary';

const categories = [
  { label: 'All programs', value: '' },
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
  if (/Computer|Information|Software|Data|Cybersecurity|Multimedia Computing|Game Development/.test(programName)) return 'Computer';
  if (/Accountancy|Accounting|Business|Entrepreneurship|Economics|Office|Customs/.test(programName)) return 'Business';
  if (/Nursing|Medical|Radiologic|Pharmacy|Therapy|Nutrition|Midwifery|Public Health/.test(programName)) return 'Health';
  if (/Education|Physical Education/.test(programName)) return 'Education';
  if (/Criminology|Psychology|Political|Social|Sociology|Public Administration|International/.test(programName)) return 'Social';
  if (/Architecture|Design|Fine Arts|Multimedia Arts|Animation|Film|Fashion/.test(programName)) return 'Arts';
  if (/Agriculture|Agribusiness|Fisheries|Forestry|Environmental/.test(programName)) return 'Agriculture';
  if (/Hospitality|Hotel|Tourism|Culinary/.test(programName)) return 'Hospitality';
  return 'Science';
}

function CareerInfo({ programName }) {
  const { jobs, salary } = getCareerInfo(programName);

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
    </div>
  );
}

function CareerLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filteredPrograms = useMemo(() => careerPrograms.filter((program) => {
    const matchesSearch = program.toLowerCase().includes(search.toLowerCase().trim());
    return matchesSearch && (!category || getCategory(program) === category);
  }), [category, search]);

  return (
    <div className="library-page">
      <div className="library-container">
        <header className="library-header">
          <button onClick={() => navigate('/home')} className="library-back-btn">← Back to Dashboard</button>
          <p className="library-eyebrow">CAREER LIBRARY</p>
          <h1>Courses, jobs, and starting salaries</h1>
          <p>Explore common entry-level roles and estimated monthly pay for every course in CourseSelector.</p>
        </header>

        <div className="library-controls">
          <label className="library-search">
            <span>Search courses</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Computer Science" />
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
            <article className="library-card" key={program}>
              <h2>{program}</h2>
              <CareerInfo programName={program} />
            </article>
          ))}
        </div>
        {!filteredPrograms.length && <p className="library-empty">No matching programs found.</p>}
        <p className="library-note">Salary figures are estimates for fresh graduates in the Philippines and vary by location, employer, skills, and licensure.</p>
      </div>
    </div>
  );
}

export { CareerInfo };
export default CareerLibrary;

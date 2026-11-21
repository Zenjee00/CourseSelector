import { getCareerInfo, getProgramDetails } from '../data/careerLibrary';
import '../FrontendCSS/CareerInfo.css';

export default function CareerInfo({ programName, showDuration = true }) {
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

import { Link } from 'react-router-dom';
import '../FrontendCSS/GuestFeatureGate.css';

export default function UpcomingMode({ title, children }) {
  return <main className="upcoming-page"><section className="upcoming-panel"><h1>{title}</h1><p>{children}</p><p>This mode is coming soon. You can take the interest assessment or browse the career library today.</p><Link to="/home">Back to CourseNFound</Link></section></main>;
}

import '../FrontendCSS/OrbitLoader.css';

export default function OrbitLoader({ label = 'Loading' }) {
  return <div className="orbit-loader" role="status"><span className="loading-indicator" aria-hidden="true" /><span>{label}</span></div>;
}

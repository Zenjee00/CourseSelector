import './OrbitLoader.css';

function OrbitLoader({ label = 'Loading' }) {
  return (
    <div className="orbit-loader" role="status" aria-label={label}>
      <svg className="orbit-loader-svg" viewBox="0 0 160 160" aria-hidden="true">
        <circle className="orbit-ring orbit-ring-primary" cx="80" cy="80" r="60" />
        <circle className="orbit-ring orbit-ring-secondary" cx="80" cy="80" r="60" />
        <circle className="orbit-core" cx="80" cy="80" r="10" />
        <g className="orbit-ticks">
          {Array.from({ length: 8 }, (_, index) => (
            <line key={index} x1="80" y1="18" x2="80" y2="28" transform={`rotate(${index * 45} 80 80)`} />
          ))}
        </g>
      </svg>
      <span className="orbit-loader-label">{label}</span>
    </div>
  );
}

export default OrbitLoader;

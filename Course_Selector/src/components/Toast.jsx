import { useEffect } from 'react';

import PropTypes from 'prop-types';

function Toast({ toast, onClose }) {
  const type = ['success', 'error', 'warning', 'info'].includes(toast.type) ? toast.type : 'info';
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' };
  const iconPaths = {
    success: <path d="M20 7 10 17l-5-5" />,
    error: <><path d="M12 8v5" /><path d="M12 17h.01" /></>,
    warning: <><path d="M12 8v5" /><path d="M12 17h.01" /></>,
    info: <><path d="M12 11v6" /><path d="M12 7h.01" /></>,
  };

  useEffect(() => {
    // Allow Escape key to dismiss the most recent toast
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={`toast toast--${type}`} role={type === 'error' || type === 'warning' ? 'alert' : 'status'}>
      <svg className="toast-wave" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 256C91 136 149 290 240 211S389 116 480 251 640 300 720 168 857 305 960 112 1086 248 1170 138 1330 254 1440 64V320H0Z" />
      </svg>
      <span className="toast-icon-container" aria-hidden="true">
        <svg className="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {type === 'warning' ? <path d="M10.3 3.8 1.8 18.4a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /> : <circle cx="12" cy="12" r="10" />}
          {iconPaths[type]}
        </svg>
      </span>
      <div className="toast-message-text-container">
        <p className="toast-message-text">{titles[type]}</p>
        <p className="toast-sub-text">{toast.message}</p>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['info', 'success', 'error', 'warning']),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Toast;

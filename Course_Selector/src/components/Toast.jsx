import {
  useEffect,
  useRef,
} from 'react';

import PropTypes from 'prop-types';

function Toast({ toast, onClose }) {
  const closeBtnRef = useRef(null);

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
    <div
      className={`toast ${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      tabIndex={0}
      aria-label={`${toast.type} notification`}
    >
      <span className="toast-message">{toast.message}</span>
      <button
        ref={closeBtnRef}
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
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

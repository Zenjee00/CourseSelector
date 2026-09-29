import {
  useEffect,
  useState,
} from 'react';

function getInitialOnlineStatus() {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    getInitialOnlineStatus,
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener(
        'online',
        handleOnline,
      )

      window.removeEventListener(
        'offline',
        handleOffline,
      )
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div
      className="offline-banner"
      role="alert"
      aria-live="assertive"
    >
      No internet connection. Some features may be unavailable.
    </div>
  )
}

export default OfflineBanner
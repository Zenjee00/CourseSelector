import { useEffect, useRef } from 'react';

// Keep keyboard users inside an open dialog and restore their starting control.
export function useDialogFocus(active, dismiss) {
  const dismissRef = useRef(dismiss);
  useEffect(() => { dismissRef.current = dismiss; }, [dismiss]);
  useEffect(() => {
    if (!active) return;
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const selector = 'button:not(:disabled), a[href], input:not(:disabled), select, textarea, [tabindex="0"]';
    const controls = () => [...dialog.querySelectorAll(selector)].filter(element => element.getClientRects().length > 0);
    const first = controls()[0];
    first?.focus();
    document.body.style.overflow = 'hidden';
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); dismissRef.current?.(); }
      if (event.key !== 'Tab') return;
      const items = controls();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [active]);
}

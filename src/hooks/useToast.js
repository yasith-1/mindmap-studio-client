import { useCallback, useRef, useState } from 'react';

/** Transient status message state with auto-dismiss. */
export function useToast(duration = 1900) {
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  const flash = useCallback(
    (message) => {
      setToast(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(''), duration);
    },
    [duration],
  );

  return { toast, flash };
}

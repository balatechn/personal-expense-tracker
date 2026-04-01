import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const add = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const success = useCallback((m) => add(m, 'success'), [add]);
  const error   = useCallback((m) => add(m, 'error'),   [add]);
  const info    = useCallback((m) => add(m, 'info'),     [add]);

  return { toasts, success, error, info };
}

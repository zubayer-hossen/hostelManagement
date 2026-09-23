import { useCallback, useEffect, useState } from 'react';

/**
 * Runs `fn` on mount and whenever `deps` change. Returns { data, loading, error, reload }.
 * `error` is set for real failures; a 404 is reported as `notFound` so pages can show an empty state.
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null, notFound: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null, notFound: false }));
    fn()
      .then((res) => { if (!cancelled) setState({ data: res.data, meta: res.meta ?? null, loading: false, error: null, notFound: false }); })
      .catch((err) => {
        if (cancelled) return;
        const notFound = err?.response?.status === 404;
        setState({ data: null, meta: null, loading: false, error: notFound ? null : err, notFound });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

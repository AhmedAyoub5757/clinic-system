import { useCallback, useEffect, useState } from "react";

// Runs `fetcher` whenever `deps` change. Returns { data, loading, error, reload }.
// Old data stays visible while reloading, and out-of-order responses are ignored.
export default function useAsync(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher()
      .then((data) => !ignore && setState({ data, loading: false, error: null }))
      .catch((error) => !ignore && setState((s) => ({ ...s, loading: false, error })));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload };
}
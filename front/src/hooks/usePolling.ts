import { useCallback, useEffect, useRef, useState } from 'react';

interface PollingState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refresh: () => void;
}

export function usePolling<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
  dependencies: unknown[] = []
): PollingState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const run = useCallback(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    loader(controller.signal)
      .then((result) => {
        if (!mountedRef.current) {
          return;
        }
        setData(result);
        setError(undefined);
      })
      .catch((err) => {
        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }
        setError(err as Error);
      })
      .finally(() => {
        if (mountedRef.current && !controller.signal.aborted) {
          setLoading(false);
        }
      });
  }, [loader, ...dependencies]);

  useEffect(() => {
    mountedRef.current = true;
    run();

    const timer = setInterval(run, intervalMs);

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      clearInterval(timer);
    };
  }, [intervalMs, run]);

  return { data, loading, error, refresh: run };
}

import { useEffect, useState } from 'react';
import type { LoadState, LoadStatus } from '../types/api';

interface Internal<T> { status: LoadStatus; data: T | null; error: Error | null }

/**
 * Executa um pedido assíncrono sempre que `deps` mudam.
 * Ignora respostas de pedidos já substituídos e mantém os dados anteriores enquanto recarrega.
 * Com `enabled = false` fica em "idle" e não faz pedidos.
 */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[], enabled = true): LoadState<T> {
  const [state, setState] = useState<Internal<T>>({ status: enabled ? 'loading' : 'idle', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', data: null, error: null });
      return undefined;
    }
    let stale = false;
    setState((s) => ({ status: 'loading', data: s.data, error: null }));
    load().then(
      (data) => {
        if (!stale) setState({ status: 'success', data, error: null });
      },
      (err: unknown) => {
        if (!stale) setState({ status: 'error', data: null, error: err instanceof Error ? err : new Error(String(err)) });
      }
    );
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

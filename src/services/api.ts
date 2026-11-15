/**
 * Camada HTTP centralizada. Nenhum componente faz fetch directamente.
 *
 * Ainda não é usada por nenhuma rota: os endpoints do backend não estão confirmados
 * (ver config/endpoints.ts e docs/INTEGRACAO.md). Quando existirem, o apiAdapter chama
 * apiGet() e converte as respostas para os tipos de src/types/.
 */
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';
import type { ApiErrorCode } from '../types/api';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** Repetições só para falhas de rede, timeout e erros 5xx. */
  retries?: number;
  /** Futuro: cabeçalho de autenticação, se o backend a exigir. */
  headers?: Record<string, string>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Substitui {chaves} no caminho: buildPath('/points/{id}', { id: 'x' }). */
export function buildPath(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(String(values[key] ?? '')));
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function attempt<T>(url: string, opts: RequestOptions): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  opts.signal?.addEventListener('abort', () => ctrl.abort(), { once: true });
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json', ...opts.headers }, signal: ctrl.signal });
  } catch (err) {
    const timedOut = ctrl.signal.aborted && !opts.signal?.aborted;
    throw new ApiError(timedOut ? 'timeout' : 'network', timedOut ? 'A API demorou demasiado a responder.' : 'Sem ligação à API.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new ApiError('http', `A API respondeu com o estado ${res.status}.`, res.status);
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('parse', 'A resposta da API não é JSON válido.');
  }
}

const retryable = (e: unknown) =>
  e instanceof ApiError && (e.code === 'network' || e.code === 'timeout' || (e.code === 'http' && (e.status ?? 0) >= 500));

export async function apiGet<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.params);
  const retries = opts.retries ?? 2;
  for (let n = 0; ; n++) {
    try {
      return await attempt<T>(url, opts);
    } catch (err) {
      if (n >= retries || !retryable(err) || opts.signal?.aborted) throw err;
      await wait(400 * 2 ** n);
    }
  }
}

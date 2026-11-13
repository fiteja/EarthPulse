import type { AdapterKind } from '../types/api';

/** Variáveis de ambiente (ver .env.example). O Vite só expõe as que começam por VITE_. */
const env = import.meta.env;

/** "mock" = dados demonstrativos; "api" = backend real (ainda não disponível). */
export const DATA_SOURCE: AdapterKind = env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock';

export const API_BASE_URL = String(env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '');
export const API_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? 10000);
export const MOCK_LATENCY_MS = Number(env.VITE_MOCK_LATENCY_MS ?? 0);

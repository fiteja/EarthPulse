/**
 * Tipos genéricos da camada de dados.
 * Os formatos JSON do backend NÃO estão definidos: serão acrescentados aqui
 * (e mapeados no apiAdapter) quando a equipa de backend os confirmar.
 */
export type AdapterKind = 'mock' | 'api';

/** Estado de um pedido assíncrono, usado pelos hooks e pelos componentes. */
export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LoadState<T> {
  status: LoadStatus;
  data: T | null;
  error: Error | null;
  retry: () => void;
}

export type ApiErrorCode = 'network' | 'timeout' | 'http' | 'parse' | 'not-available';

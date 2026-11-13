/** Cache em memória com TTL e partilha de pedidos em curso. Falhas nunca são guardadas. */
interface Entry { expires: number; value: unknown }

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = load()
    .then((value) => {
      store.set(key, { expires: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function clearCache(): void {
  store.clear();
}

import { EXPECTED_PROVINCES, PROVINCE_SOURCES, type ProvinceSource } from '../config/mapSources';
import type { GeoCollection, GeoFeature, ProvinceRef } from '../types/geography';
import { geometryCentroid, inAngolaBounds, pointInGeometry } from '../utils/geo';

export interface ProvincesResult {
  data: GeoCollection;
  refs: ProvinceRef[];
  sourceId: string;
  attribution: string;
  count: number;
  expected: number;
  /** true se o número de províncias difere do esperado (versão antiga ou incompleta dos limites). */
  mismatch: boolean;
}

const NAME_KEYS = ['name', 'shapeName', 'NAME_1', 'name_pt', 'name_en', 'NAME', 'admin1', 'ADM1_PT', 'ADM1_EN'];

function featureName(props: Record<string, unknown> | null): string | null {
  for (const key of NAME_KEYS) {
    const v = props?.[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Valida um GeoJSON de limites e uniformiza o nome em properties.name.
 * Rejeita ficheiros que não sejam polígonos, sem nomes ou que não sejam de Angola.
 */
export function normalizeProvinces(raw: unknown): GeoCollection {
  const fc = raw as Partial<GeoCollection> | null;
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('não é um FeatureCollection GeoJSON');
  }
  const features: GeoFeature[] = [];
  for (const f of fc.features) {
    const g = f?.geometry;
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue;
    const name = featureName(f.properties ?? null);
    if (!name) continue;
    features.push({ type: 'Feature', properties: { ...f.properties, name }, geometry: g });
  }
  if (features.length < 10) throw new Error(`apenas ${features.length} províncias válidas`);

  const inside = features.filter((f) => {
    const c = f.geometry ? geometryCentroid(f.geometry) : null;
    return c !== null && inAngolaBounds(c.lat, c.lon);
  }).length;
  if (inside / features.length < 0.8) throw new Error('os limites não parecem ser de Angola');
  return { type: 'FeatureCollection', features };
}

async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('a resposta não é JSON (ficheiro em falta ou ponteiro Git LFS)');
  }
}

async function loadFrom(source: ProvinceSource): Promise<GeoCollection> {
  let url = source.url;
  if (source.kind === 'geoboundaries-api') {
    const meta = parseJson(await fetchText(url));
    const info = (Array.isArray(meta) ? meta[0] : meta) as { simplifiedGeometryGeoJSON?: string; gjDownloadURL?: string } | undefined;
    const next = info?.simplifiedGeometryGeoJSON ?? info?.gjDownloadURL;
    if (!next) throw new Error('a API não indicou o ficheiro de limites');
    url = next;
  }
  return normalizeProvinces(parseJson(await fetchText(url)));
}

function buildRefs(data: GeoCollection): ProvinceRef[] {
  const refs: ProvinceRef[] = [];
  const seen = new Set<string>();
  for (const f of data.features) {
    const name = String(f.properties?.name ?? '');
    const c = f.geometry ? geometryCentroid(f.geometry) : null;
    if (name && c && !seen.has(name)) {
      seen.add(name);
      refs.push({ name, lat: c.lat, lon: c.lon });
    }
  }
  return refs;
}

let pending: Promise<ProvincesResult> | null = null;

/** Tenta cada fonte por ordem e devolve a primeira válida. Em caso de falha total, lança um erro com os motivos. */
export function loadProvinces(): Promise<ProvincesResult> {
  if (pending) return pending;
  pending = (async () => {
    const reasons: string[] = [];
    for (const source of PROVINCE_SOURCES) {
      try {
        const data = await loadFrom(source);
        const refs = buildRefs(data);
        return {
          data,
          refs,
          sourceId: source.id,
          attribution: source.attribution,
          count: refs.length,
          expected: EXPECTED_PROVINCES,
          mismatch: refs.length !== EXPECTED_PROVINCES,
        };
      } catch (err) {
        reasons.push(`${source.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new Error(`Não foi possível carregar as províncias. ${reasons.join(' | ')}`);
  })();
  pending.catch(() => {
    pending = null; // permite tentar de novo
  });
  return pending;
}

/** Província que contém o ponto (ou undefined se o ponto estiver fora de todas as províncias carregadas). */
export function provinceAt(result: ProvincesResult, lat: number, lon: number): ProvinceRef | undefined {
  for (const f of result.data.features) {
    if (f.geometry && pointInGeometry(lat, lon, f.geometry)) {
      return result.refs.find((r) => r.name === String(f.properties?.name));
    }
  }
  return undefined;
}

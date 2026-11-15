import type maplibregl from 'maplibre-gl';
import { COUNTRIES } from '../../config/mapSources';
import type { ProvincesResult } from '../../services/provinces';
import type { Selection } from '../../types/geography';
import { analysisFeature } from '../../utils/geo';

type LayerSpec = Parameters<maplibregl.Map['addLayer']>[0];
type Filter = Parameters<maplibregl.Map['setFilter']>[1];

const CYAN = '#7fe3f5';
const HALO = '#04060b';
const TOP = 'analysis-fill'; // as camadas de dados ficam sempre abaixo da área de análise

const spec = (s: object) => s as unknown as LayerSpec;
const addBelowTop = (m: maplibregl.Map, s: object) => m.addLayer(spec(s), m.getLayer(TOP) ? TOP : undefined);
const emptyCollection = { type: 'FeatureCollection', features: [] } as never;

/** Camadas que respondem ao clique/cursor, por ordem de preferência. */
export const CLICK_LAYERS = ['province-fill', 'country-fill'];

/** Área de análise de 1 km à volta do ponto seleccionado. */
export function addAnalysisLayers(m: maplibregl.Map): void {
  m.addSource('analysis', { type: 'geojson', data: emptyCollection });
  m.addLayer(spec({ id: 'analysis-fill', type: 'fill', source: 'analysis', paint: { 'fill-color': CYAN, 'fill-opacity': 0.14 } }));
  m.addLayer(spec({ id: 'analysis-line', type: 'line', source: 'analysis', paint: { 'line-color': CYAN, 'line-width': 2, 'line-dasharray': [2, 1.5] } }));
}

// O Vite devolve index.html para ficheiros em falta, por isso verifica-se o tipo de conteúdo.
async function localOrNull(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? url : null;
  } catch {
    return null;
  }
}

/** Fronteiras nacionais e o nome de Angola. */
export async function addCountryLayers(m: maplibregl.Map): Promise<void> {
  const data = (await localOrNull(COUNTRIES.local)) ?? COUNTRIES.remote;
  m.addSource('countries', { type: 'geojson', data, attribution: COUNTRIES.attribution });
  const angola = ['==', ['get', 'ADMIN'], 'Angola'];
  addBelowTop(m, { id: 'country-lines', type: 'line', source: 'countries', paint: { 'line-color': CYAN, 'line-opacity': 0.5, 'line-width': 0.9 } });
  addBelowTop(m, { id: 'country-fill', type: 'fill', source: 'countries', filter: angola, paint: { 'fill-color': '#000', 'fill-opacity': 0.01 } });
  addBelowTop(m, {
    id: 'country-label',
    type: 'symbol',
    source: 'countries',
    minzoom: 2,
    filter: angola,
    layout: { 'text-field': 'ANGOLA', 'text-font': ['Open Sans Regular'], 'text-size': 15, 'text-letter-spacing': 0.3 },
    paint: { 'text-color': '#ffffff', 'text-halo-color': HALO, 'text-halo-width': 1.6 },
  });
}

/** Limites das províncias: camada colorível, alvo de clique, destaque da selecionada, linhas e nomes. */
export function addProvinceLayers(m: maplibregl.Map, provinces: ProvincesResult): void {
  if (m.getSource('provinces')) return;
  m.addSource('provinces', { type: 'geojson', data: provinces.data as never, attribution: provinces.attribution });
  const none = ['==', ['get', 'name'], ''];
  addBelowTop(m, {
    id: 'province-choropleth',
    type: 'fill',
    source: 'provinces',
    layout: { visibility: 'none' },
    paint: { 'fill-color': 'rgba(0,0,0,0)', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.62, 11, 0.25] },
  });
  addBelowTop(m, { id: 'province-fill', type: 'fill', source: 'provinces', paint: { 'fill-color': '#000', 'fill-opacity': 0.01 } });
  addBelowTop(m, { id: 'province-selected-fill', type: 'fill', source: 'provinces', filter: none, paint: { 'fill-color': CYAN, 'fill-opacity': 0.12 } });
  addBelowTop(m, { id: 'province-lines', type: 'line', source: 'provinces', minzoom: 2, paint: { 'line-color': CYAN, 'line-opacity': 0.85, 'line-width': 1 } });
  addBelowTop(m, { id: 'province-selected-line', type: 'line', source: 'provinces', filter: none, paint: { 'line-color': '#ffffff', 'line-width': 2.4 } });
  addBelowTop(m, {
    id: 'province-labels',
    type: 'symbol',
    source: 'provinces',
    minzoom: 4,
    layout: { 'text-field': ['get', 'name'], 'text-font': ['Open Sans Regular'], 'text-size': 12 },
    paint: { 'text-color': '#ffffff', 'text-halo-color': HALO, 'text-halo-width': 1.5 },
  });
}

/** Pinta as províncias com as cores recebidas (nome → cor). Sem cores, esconde a camada. */
export function setChoropleth(m: maplibregl.Map, colors: Record<string, string> | null): void {
  if (!m.getLayer('province-choropleth')) return;
  const entries = colors ? Object.entries(colors) : [];
  if (entries.length === 0) {
    m.setLayoutProperty('province-choropleth', 'visibility', 'none');
    return;
  }
  const expr: unknown[] = ['match', ['get', 'name']];
  for (const [name, color] of entries) expr.push(name, color);
  expr.push('rgba(0,0,0,0)');
  m.setPaintProperty('province-choropleth', 'fill-color', expr);
  m.setLayoutProperty('province-choropleth', 'visibility', 'visible');
}

/** Destaca a província da selecção e desenha a área de análise de 1 km (só em pontos). */
export function setSelectionLayers(m: maplibregl.Map, sel: Selection | null): void {
  const name = sel?.province?.name ?? '';
  const filter = ['==', ['get', 'name'], name] as unknown as Filter;
  for (const id of ['province-selected-fill', 'province-selected-line']) {
    if (m.getLayer(id)) m.setFilter(id, filter);
  }
  const source = m.getSource('analysis') as maplibregl.GeoJSONSource | undefined;
  source?.setData((sel && sel.kind === 'point' ? analysisFeature(sel.lat, sel.lon) : emptyCollection) as never);
}

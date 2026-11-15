import type maplibregl from 'maplibre-gl';
import { GLOBE } from '../../config/globe';
import { IMAGERY, VECTOR } from '../../config/mapSources';

type Layers = maplibregl.StyleSpecification['layers'];

/**
 * Estilo base do globo: satélite global, satélite de detalhe e dados vetoriais
 * (ruas, edifícios, nomes de vias e localidades). Os limites e as camadas de dados
 * são acrescentados depois (layers.ts).
 *
 * As expressões do MapLibre são tipadas de forma estrita e muito verbosa;
 * o cast único abaixo evita ruído sem perder a validação feita pelo MapLibre em runtime.
 */
const layers = [
  { id: 'bg', type: 'background', paint: { 'background-color': '#04060b' } },
  { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-brightness-max': 1, 'raster-saturation': 0.12, 'raster-contrast': 0.1 } },
  {
    id: 'eox',
    type: 'raster',
    source: 'eox',
    paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], IMAGERY.detail.fadeFrom, 0, IMAGERY.detail.fadeTo, 1] },
  },
  {
    id: 'osm-roads',
    type: 'line',
    source: 'osm',
    'source-layer': 'transportation',
    minzoom: VECTOR.roadsMinZoom,
    filter: ['!', ['in', ['get', 'class'], ['literal', ['rail', 'transit', 'ferry', 'aerialway']]]],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'class'], ['motorway', 'trunk'], '#ffb457', ['primary'], '#ffd37a', '#ffffff'],
      'line-opacity': 0.75,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 16, 3.5],
    },
  },
  {
    id: 'osm-buildings',
    type: 'fill-extrusion',
    source: 'osm',
    'source-layer': 'building',
    minzoom: VECTOR.buildingsMinZoom,
    paint: {
      'fill-extrusion-color': '#d9dee6',
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.88,
    },
  },
  {
    id: 'osm-places',
    type: 'symbol',
    source: 'osm',
    'source-layer': 'place',
    minzoom: 9,
    filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village', 'suburb', 'neighbourhood', 'hamlet']]],
    layout: {
      'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
      'text-font': ['Open Sans Regular'],
      'text-size': ['match', ['get', 'class'], 'city', 14, 'town', 13, 'village', 12, 11],
    },
    paint: { 'text-color': '#ffffff', 'text-halo-color': '#04060b', 'text-halo-width': 1.4 },
  },
  {
    id: 'osm-road-names',
    type: 'symbol',
    source: 'osm',
    'source-layer': 'transportation_name',
    minzoom: VECTOR.namesMinZoom,
    layout: {
      'symbol-placement': 'line',
      'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
      'text-font': ['Open Sans Regular'],
      'text-size': 11,
    },
    paint: { 'text-color': '#ffffff', 'text-halo-color': '#04060b', 'text-halo-width': 1.4 },
  },
] as unknown as Layers;

export function buildStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: GLOBE.glyphs,
    sources: {
      sat: {
        type: 'raster',
        tiles: IMAGERY.base.tiles,
        tileSize: 256,
        maxzoom: IMAGERY.base.maxzoom,
        attribution: `${IMAGERY.base.attribution} · ${IMAGERY.detail.attribution}`,
      },
      eox: { type: 'raster', tiles: IMAGERY.detail.tiles, tileSize: 256, maxzoom: IMAGERY.detail.maxzoom },
      osm: { type: 'vector', url: VECTOR.url, attribution: VECTOR.attribution },
    },
    layers,
  };
}

import { ANALYSIS } from '../config/globe';
import type { GeoFeature } from '../types/geography';

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON = 111.32;

/** Quadrado centrado no ponto, com `sideKm` de lado. */
function squareRing(lat: number, lon: number, sideKm: number): number[][] {
  const dLat = sideKm / 2 / KM_PER_DEG_LAT;
  const dLon = sideKm / 2 / (KM_PER_DEG_LON * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ];
}

/** Círculo aproximado por `steps` segmentos. */
function circleRing(lat: number, lon: number, radiusKm: number, steps = 64): number[][] {
  const ring: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([
      lon + (Math.cos(a) * radiusKm) / (KM_PER_DEG_LON * Math.cos((lat * Math.PI) / 180)),
      lat + (Math.sin(a) * radiusKm) / KM_PER_DEG_LAT,
    ]);
  }
  return ring;
}

/** Abrangência de análise (config/globe.ts) como feature GeoJSON. */
export function analysisFeature(lat: number, lon: number): GeoFeature {
  const ring = ANALYSIS.shape === 'circle' ? circleRing(lat, lon, ANALYSIS.radiusKm) : squareRing(lat, lon, ANALYSIS.sideKm);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

export const analysisAreaKm2 = (): number =>
  ANALYSIS.shape === 'circle' ? Math.PI * ANALYSIS.radiusKm ** 2 : ANALYSIS.sideKm ** 2;

interface RingInfo { area: number; lon: number; lat: number }

function ringCentroid(ring: number[][]): RingInfo {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a /= 2;
  if (Math.abs(a) < 1e-12) {
    const n = ring.length || 1;
    return { area: 0, lon: ring.reduce((s, p) => s + p[0], 0) / n, lat: ring.reduce((s, p) => s + p[1], 0) / n };
  }
  return { area: Math.abs(a), lon: cx / (6 * a), lat: cy / (6 * a) };
}

/** Centróide do maior polígono de uma geometria Polygon/MultiPolygon. */
export function geometryCentroid(geometry: { type: string; coordinates: unknown }): { lat: number; lon: number } | null {
  const polygons: number[][][][] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as number[][][][])
        : [];
  let best: RingInfo | null = null;
  for (const poly of polygons) {
    if (!poly[0] || poly[0].length < 3) continue;
    const c = ringCentroid(poly[0]);
    if (!best || c.area > best.area) best = c;
  }
  return best ? { lat: best.lat, lon: best.lon } : null;
}

/** Limites aproximados de Angola, só para validar que um ficheiro de limites é mesmo de Angola. */
export const ANGOLA_BOUNDS = { minLat: -19, maxLat: -4, minLon: 11, maxLon: 25 };

export const inAngolaBounds = (lat: number, lon: number) =>
  lat >= ANGOLA_BOUNDS.minLat && lat <= ANGOLA_BOUNDS.maxLat && lon >= ANGOLA_BOUNDS.minLon && lon <= ANGOLA_BOUNDS.maxLon;

/** Teste ponto-em-anel (ray casting). */
function inRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** O ponto está dentro de um Polygon/MultiPolygon (respeitando buracos)? */
export function pointInGeometry(lat: number, lon: number, geometry: { type: string; coordinates: unknown }): boolean {
  const polygons: number[][][][] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as number[][][][])
        : [];
  return polygons.some((rings) => inRing(lat, lon, rings[0]) && !rings.slice(1).some((hole) => inRing(lat, lon, hole)));
}

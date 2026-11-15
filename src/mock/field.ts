/**
 * DADOS DEMONSTRATIVOS. Não são medições reais.
 *
 * Gerador determinístico: o valor varia de forma suave no espaço (sem saltos entre zonas
 * vizinhas) e muda pouco de ano para ano. Só o mockAdapter importa este ficheiro.
 */
import { META, YEARS } from '../config/indicators';
import { PLACES } from '../services/places';
import type { IndicatorId, IndicatorSeriesPoint } from '../types/indicators';

const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

interface Wave { fLat: number; fLon: number; phase: number; weight: number }
const waveCache = new Map<string, Wave[]>();

function waves(seed: string): Wave[] {
  let w = waveCache.get(seed);
  if (!w) {
    w = Array.from({ length: 4 }, (_, i) => ({
      fLat: 0.25 + hash(`${seed}:a${i}`) * 0.9,
      fLon: 0.25 + hash(`${seed}:b${i}`) * 0.9,
      phase: hash(`${seed}:p${i}`) * TAU,
      weight: 1 / (i + 1),
    }));
    waveCache.set(seed, w);
  }
  return w;
}

/** Ruído suave entre 0 e 1 (soma de ondas); frequências em rad/grau, ou seja, variação em dezenas de km. */
function smoothNoise(lat: number, lon: number, seed: string): number {
  let sum = 0;
  let total = 0;
  for (const w of waves(seed)) {
    sum += w.weight * Math.sin(w.fLat * lat + w.fLon * lon + w.phase);
    total += w.weight;
  }
  return clamp01(0.5 + (sum / total) * 0.9);
}

function capitalProximity(lat: number, lon: number): number {
  let best = 0;
  for (const p of PLACES) {
    const d2 = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
    best = Math.max(best, (p.name === 'Luanda' ? 1 : 0.55) * Math.exp(-d2 / (2 * 1.1 * 1.1)));
  }
  return best;
}

/** Tendências gerais só para a demonstração parecer plausível (norte mais húmido e verde, etc.). */
const TREND: Record<IndicatorId, (lat: number, lon: number) => number> = {
  ndvi: (lat) => clamp01((lat + 17) / 12),
  temperature: (lat, lon) => clamp01(0.45 + (lon - 15) / 30 + (lat + 12) / 60),
  precipitation: (lat, lon) => clamp01((lat + 16) / 11 - Math.max(0, 13.8 - lon) * 0.04),
  population: capitalProximity,
  mortality: () => 0.5,
};

const NOISE_WEIGHT: Record<IndicatorId, number> = {
  ndvi: 0.4,
  temperature: 0.4,
  precipitation: 0.4,
  population: 0.3,
  mortality: 1,
};

export function mockValue(lat: number, lon: number, id: IndicatorId, year: number): number {
  const { min, max } = META[id];
  const w = NOISE_WEIGHT[id];
  const base = (1 - w) * TREND[id](lat, lon) + w * smoothNoise(lat, lon, id);
  const drift = (hash(`${id}:${year}`) - 0.5) * 0.08;
  return min + clamp01(base + drift) * (max - min);
}

export const mockSeries = (lat: number, lon: number, id: IndicatorId): IndicatorSeriesPoint[] =>
  YEARS.map((year) => ({ year, value: mockValue(lat, lon, id, year) }));

import type { IndicatorId, Provenance, SpatialResolution } from '../types/indicators';

export type Bilingual = [pt: string, en: string];

/** Tudo o que a interface precisa de saber sobre um indicador. Para acrescentar um, basta uma entrada aqui. */
export interface IndicatorMeta {
  id: IndicatorId;
  unit: string;
  /** Intervalo usado na escala de cores e na legenda. */
  min: number;
  max: number;
  decimals: number;
  /** Escala de cores específica do indicador (do valor mínimo ao máximo). */
  ramp: string[];
  source: string;
  dataset: string;
  spatialResolution: SpatialResolution;
  /** Resolução da grelha em metros (só quando spatialResolution = "grid"). */
  gridMeters: number | null;
  frequency: string;
  description: Bilingual;
  scale: Bilingual;
  limitation: Bilingual;
}

export const YEARS = [2021, 2022, 2023, 2024, 2025];
export const IDS: IndicatorId[] = ['ndvi', 'temperature', 'precipitation', 'population', 'mortality'];

export const META: Record<IndicatorId, IndicatorMeta> = {
  ndvi: {
    id: 'ndvi',
    unit: '',
    min: 0.1,
    max: 0.8,
    decimals: 2,
    ramp: ['#8c6d3f', '#d6c27a', '#8fbf5a', '#2f8f46', '#0d5c2e'],
    source: 'NASA MODIS (MOD13)',
    dataset: 'MODIS MOD13',
    spatialResolution: 'grid',
    gridMeters: 250,
    frequency: '16 d',
    description: [
      'Mede o verde da vegetação a partir da luz refletida: valores altos indicam vegetação densa e saudável.',
      'Measures vegetation greenness from reflected light: high values mean dense, healthy vegetation.',
    ],
    scale: ['−1 a 1 (acima de 0,6: vegetação densa)', '−1 to 1 (above 0.6: dense vegetation)'],
    limitation: [
      'Nuvens e saturação em floresta densa afetam a leitura.',
      'Clouds and saturation over dense forest affect readings.',
    ],
  },
  temperature: {
    id: 'temperature',
    unit: '°C',
    min: 18,
    max: 32,
    decimals: 1,
    ramp: ['#3b6cff', '#6fd0e8', '#f2e27a', '#f2a541', '#c8442d'],
    source: 'NASA MODIS (MOD11)',
    dataset: 'MODIS MOD11',
    spatialResolution: 'grid',
    gridMeters: 1000,
    frequency: '8 d',
    description: [
      'Temperatura da superfície terrestre, não a do ar.',
      'Land surface temperature, not air temperature.',
    ],
    scale: ['°C, média anual', '°C, annual mean'],
    limitation: ['Falhas em dias nublados; superfície ≠ ar.', 'Gaps on cloudy days; surface ≠ air.'],
  },
  precipitation: {
    id: 'precipitation',
    unit: 'mm',
    min: 200,
    max: 1600,
    decimals: 0,
    ramp: ['#f3e9c6', '#9ed3e6', '#4a9fd8', '#2a62c9', '#17327a'],
    source: 'NASA GPM IMERG',
    dataset: 'GPM IMERG',
    spatialResolution: 'grid',
    gridMeters: 11000,
    frequency: '30 min',
    description: ['Chuva acumulada estimada por satélite.', 'Satellite-estimated accumulated rainfall.'],
    scale: ['mm por ano', 'mm per year'],
    limitation: [
      'Incerteza em chuva intensa e em zonas de relevo.',
      'Uncertainty in heavy rain and rugged terrain.',
    ],
  },
  population: {
    id: 'population',
    unit: 'hab/km²',
    min: 1,
    max: 400,
    decimals: 0,
    ramp: ['#1b2430', '#3a4c78', '#7a62c9', '#d968a8', '#ffd27a'],
    source: 'SEDAC GPW v4',
    dataset: 'SEDAC GPW v4',
    spatialResolution: 'grid',
    gridMeters: 1000,
    frequency: '5 y',
    description: ['Quantas pessoas vivem em cada km².', 'How many people live per km².'],
    scale: ['hab/km²', 'inhabitants/km²'],
    limitation: [
      'Baseado em censos e projeções; resolução de cerca de 1 km.',
      'Based on censuses and projections; roughly 1 km resolution.',
    ],
  },
  mortality: {
    id: 'mortality',
    unit: '‰',
    min: 5,
    max: 18,
    decimals: 1,
    ramp: ['#2f6f4f', '#c8d36a', '#f2c14e', '#e8793a', '#b3261e'],
    source: 'A definir (fonte estatística oficial)',
    dataset: 'A definir',
    spatialResolution: 'province',
    gridMeters: null,
    frequency: '—',
    description: [
      'Taxa bruta de mortalidade: óbitos por 1000 habitantes num ano. Não inclui mortalidade infantil.',
      'Crude death rate: deaths per 1000 inhabitants in a year. Does not include infant mortality.',
    ],
    scale: ['óbitos por 1000 habitantes por ano', 'deaths per 1000 inhabitants per year'],
    limitation: [
      'Resolução real da fonte por confirmar (assumida ao nível da província). Não vem de satélite nem tem resolução de 1 km.',
      'True source resolution to be confirmed (assumed at province level). Not satellite-derived and not 1 km resolution.',
    ],
  },
};

const pick = (b: Bilingual, lang: string) => (lang === 'pt' ? b[0] : b[1]);

/** Texto da resolução espacial real da fonte, para mostrar ao utilizador. */
export function resolutionLabel(id: IndicatorId, lang: string): string {
  const m = META[id];
  if (m.spatialResolution === 'province') return lang === 'pt' ? 'Província' : 'Province';
  const g = m.gridMeters ?? 0;
  return g >= 1000 ? `${g / 1000} km` : `${g} m`;
}

/** Proveniência por omissão (quando a fonte de dados não a envia). */
export function provenanceOf(id: IndicatorId, lang: string): Provenance {
  const m = META[id];
  return {
    source: m.source,
    dataset: m.dataset,
    period: `${YEARS[0]} – ${YEARS[YEARS.length - 1]}`,
    unit: m.unit || (lang === 'pt' ? 'índice' : 'index'),
    limitation: pick(m.limitation, lang),
  };
}

export const describe = (id: IndicatorId, lang: string) => pick(META[id].description, lang);
export const scaleOf = (id: IndicatorId, lang: string) => pick(META[id].scale, lang);

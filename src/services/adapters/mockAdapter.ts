import { IDS, META, YEARS } from '../../config/indicators';
import { MOCK_LATENCY_MS } from '../../config/env';
import { mockSeries, mockValue } from '../../mock/field';
import type { IndicatorId, LocationIndicator } from '../../types/indicators';
import { analysisAreaKm2 } from '../../utils/geo';
import { PLACES } from '../places';
import type { DataAdapter } from './types';

const latency = () => (MOCK_LATENCY_MS > 0 ? new Promise<void>((r) => setTimeout(r, MOCK_LATENCY_MS)) : Promise.resolve());

/** Dados demonstrativos. A interface identifica-os sempre como tal (ver DemoChip). */
export const mockAdapter: DataAdapter = {
  kind: 'mock',

  async getLocation(selection) {
    await latency();
    const indicators = {} as Record<IndicatorId, LocationIndicator>;
    for (const id of IDS) {
      // Indicadores com resolução por província têm um único valor em toda a província.
      const at = META[id].spatialResolution === 'province' && selection.province ? selection.province : selection;
      indicators[id] = { series: mockSeries(at.lat, at.lon, id) };
    }
    return {
      lat: selection.lat,
      lon: selection.lon,
      areaKm2: selection.kind === 'point' ? analysisAreaKm2() : null,
      indicators,
    };
  },

  async getCapitalsTable(indicator) {
    await latency();
    return PLACES.map((p) => ({
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      values: YEARS.map((y) => mockValue(p.lat, p.lon, indicator, y)),
    }));
  },

  async getProvinceValues({ indicator, year, provinces }) {
    await latency();
    return Object.fromEntries(provinces.map((p) => [p.name, mockValue(p.lat, p.lon, indicator, year)]));
  },
};

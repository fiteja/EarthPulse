/**
 * Único ponto de acesso aos dados. Os componentes usam os hooks de hooks/useData.ts,
 * que chamam este serviço; nunca importam mocks nem fazem fetch.
 *
 * A origem é escolhida por VITE_DATA_SOURCE (ver config/env.ts).
 */
import { DATA_SOURCE } from '../config/env';
import type { ProvinceRef, Selection } from '../types/geography';
import type { IndicatorId } from '../types/indicators';
import { apiAdapter } from './adapters/apiAdapter';
import { mockAdapter } from './adapters/mockAdapter';
import type { DataAdapter } from './adapters/types';
import { cached } from './cache';

const adapter: DataAdapter = DATA_SOURCE === 'api' ? apiAdapter : mockAdapter;
const TTL_MS = 5 * 60 * 1000;
const c5 = (n: number) => n.toFixed(5);

export const dataService = {
  kind: adapter.kind,
  /** true enquanto os dados forem demonstrativos: a interface mostra o selo "Demonstrativo". */
  isDemo: adapter.kind === 'mock',

  getLocation: (s: Selection) =>
    cached(`loc:${s.kind}:${c5(s.lat)},${c5(s.lon)}:${s.province?.name ?? ''}`, TTL_MS, () => adapter.getLocation(s)),

  getCapitalsTable: (indicator: IndicatorId) =>
    cached(`cap:${indicator}`, TTL_MS, () => adapter.getCapitalsTable(indicator)),

  getProvinceValues: (indicator: IndicatorId, year: number, provinces: ProvinceRef[]) =>
    cached(`prov:${indicator}:${year}:${provinces.length}`, TTL_MS, () =>
      adapter.getProvinceValues({ indicator, year, provinces })
    ),
};

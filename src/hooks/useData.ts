import { useMemo } from 'react';
import { META } from '../config/indicators';
import { dataService } from '../services/dataService';
import { loadProvinces, type ProvincesResult } from '../services/provinces';
import type { LoadState } from '../types/api';
import type { Selection } from '../types/geography';
import type { CapitalRow, IndicatorId, LocationData, ProvinceValues } from '../types/indicators';
import { rampColor } from '../utils/colors';
import { useAsync } from './useAsync';

/** Limites das províncias (validados). */
export const useProvinces = (): LoadState<ProvincesResult> => useAsync(() => loadProvinces(), []);

/** Indicadores da localização seleccionada (ponto ou província). */
export const useLocationData = (sel: Selection | null): LoadState<LocationData> =>
  useAsync(() => dataService.getLocation(sel as Selection), [sel?.kind, sel?.lat, sel?.lon, sel?.province?.name], sel !== null);

/** Valores por capital, um por ano. */
export const useCapitalsTable = (indicator: IndicatorId): LoadState<CapitalRow[]> =>
  useAsync(() => dataService.getCapitalsTable(indicator), [indicator]);

/** Valor do indicador por província, num ano. */
export const useProvinceValues = (
  indicator: IndicatorId | null,
  year: number,
  provinces: ProvincesResult | null
): LoadState<ProvinceValues> =>
  useAsync(
    () => dataService.getProvinceValues(indicator as IndicatorId, year, (provinces as ProvincesResult).refs),
    [indicator, year, provinces],
    indicator !== null && provinces !== null
  );

/** Cor de cada província segundo a escala do indicador, para a camada do globo. */
export function useChoropleth(layer: IndicatorId | null, year: number, provinces: ProvincesResult | null) {
  const values = useProvinceValues(layer, year, provinces);
  const colors = useMemo<Record<string, string> | null>(() => {
    if (!layer || !values.data) return null;
    const { min, max, ramp } = META[layer];
    const out: Record<string, string> = {};
    for (const [name, v] of Object.entries(values.data)) {
      if (Number.isFinite(v)) out[name] = rampColor(ramp, (v - min) / (max - min));
    }
    return out;
  }, [layer, values.data]);
  return { colors, status: values.status };
}

import type { IndicatorSeriesPoint } from '../types/indicators';

/** Valor de uma série num ano (NaN se não existir). */
export const valueAt = (series: IndicatorSeriesPoint[] | undefined, year: number): number =>
  series?.find((s) => s.year === year)?.value ?? NaN;

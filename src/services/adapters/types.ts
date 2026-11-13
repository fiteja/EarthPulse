import type { AdapterKind } from '../../types/api';
import type { ProvinceRef, Selection } from '../../types/geography';
import type { CapitalRow, IndicatorId, LocationData, ProvinceValues } from '../../types/indicators';

/** Contrato interno entre o dataService e uma origem de dados (mock ou API real). */
export interface DataAdapter {
  readonly kind: AdapterKind;
  /** Todos os indicadores, todos os anos, para um ponto ou para uma província. */
  getLocation(selection: Selection): Promise<LocationData>;
  /** Valores por capital, alinhados com YEARS. */
  getCapitalsTable(indicator: IndicatorId): Promise<CapitalRow[]>;
  /** Valor do indicador, num ano, por província (para colorir o globo). */
  getProvinceValues(req: { indicator: IndicatorId; year: number; provinces: ProvinceRef[] }): Promise<ProvinceValues>;
}

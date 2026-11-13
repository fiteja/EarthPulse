/** Identificadores dos indicadores disponíveis na interface. */
export type IndicatorId = 'ndvi' | 'temperature' | 'precipitation' | 'population' | 'mortality';

/** Resolução espacial real da fonte: grelha (pixéis) ou unidade administrativa. */
export type SpatialResolution = 'grid' | 'province';

export interface IndicatorSeriesPoint {
  year: number;
  value: number;
}

/** Proveniência de um valor (cada valor mostrado deve poder indicar a sua origem). */
export interface Provenance {
  source: string;
  dataset: string;
  period: string;
  unit: string;
  limitation: string;
}

export interface LocationIndicator {
  series: IndicatorSeriesPoint[];
  /** Se a futura API a enviar, tem prioridade sobre os textos de config/indicators.ts. */
  provenance?: Provenance;
}

/** Todos os indicadores, em todos os anos, para uma localização. */
export interface LocationData {
  lat: number;
  lon: number;
  /** Área de análise em km². null quando a localização é uma província inteira. */
  areaKm2: number | null;
  indicators: Record<IndicatorId, LocationIndicator>;
}

/** Linha da tabela de capitais. `values` está alinhado com YEARS (NaN = sem dado). */
export interface CapitalRow {
  name: string;
  lat: number;
  lon: number;
  values: number[];
}

/** Valor de um indicador por nome de província. */
export type ProvinceValues = Record<string, number>;

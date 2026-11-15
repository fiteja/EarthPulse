/**
 * Endpoints PREVISTOS para o backend FastAPI.
 *
 * São exemplos de planeamento, NÃO contratos confirmados: nenhum pedido é feito a
 * estas rotas enquanto a equipa de backend não definir os formatos de resposta.
 * Documentação completa em docs/INTEGRACAO.md.
 */
export interface PlannedEndpoint {
  method: 'GET';
  path: string;
  purpose: string;
  /** Componentes ou hooks que vão consumir a rota. */
  usedBy: string[];
  confirmed: boolean;
}

export const ENDPOINTS = {
  provinces: {
    method: 'GET',
    path: '/provinces',
    purpose: 'Lista de províncias (id, nome, centróide).',
    usedBy: ['useProvinces', 'TopBar (pesquisa)'],
    confirmed: false,
  },
  province: {
    method: 'GET',
    path: '/provinces/{id}',
    purpose: 'Indicadores de uma província.',
    usedBy: ['useLocationData (kind = province)'],
    confirmed: false,
  },
  point: {
    method: 'GET',
    path: '/points/{id}',
    purpose: 'Indicadores de um ponto geográfico (a forma de identificar o ponto está por definir).',
    usedBy: ['useLocationData (kind = point)', 'DataPanel'],
    confirmed: false,
  },
  indicators: {
    method: 'GET',
    path: '/indicators',
    purpose: 'Catálogo de indicadores e respectivos metadados.',
    usedBy: ['config/indicators.ts (futuro)', 'IndicatorRail'],
    confirmed: false,
  },
  indicator: {
    method: 'GET',
    path: '/indicators/{indicator}',
    purpose: 'Valores de um indicador por província/capital num período.',
    usedBy: ['useProvinceValues', 'useCapitalsTable', 'LayerLegend'],
    confirmed: false,
  },
  series: {
    method: 'GET',
    path: '/indicators/{indicator}/series',
    purpose: 'Série temporal de um indicador.',
    usedBy: ['DataPanel (gráfico)', 'IndicatorsPage'],
    confirmed: false,
  },
} as const satisfies Record<string, PlannedEndpoint>;

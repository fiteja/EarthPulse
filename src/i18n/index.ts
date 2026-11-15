export type Lang = 'pt' | 'en';

const dict: Record<Lang, Record<string, string>> = {
  pt: {
    map: 'Mapa', indicators: 'Indicadores', data: 'Dados', searchPh: 'Pesquisar província, capital ou lat, lon…',
    layers: 'Camadas', ndvi: 'NDVI', temperature: 'Temperatura', precipitation: 'Precipitação', population: 'População',
    mortality: 'Mortalidade',
    pick: 'Selecione uma localização no mapa ou escolha uma província para começar.',
    demo: 'Demonstrativo', near: 'Perto de', explore: 'Explorar Angola', aiPh: 'Pergunte ao EarthPulse…',
    aiSoon: 'Assistente em desenvolvimento.', highlights: 'Destaques', byPlace: 'Indicador por capital',
    period: 'Período', highest: 'Valor mais alto', lowest: 'Valor mais baixo',
    close: 'Limpar seleção', minimize: 'Minimizar', language: 'Idioma',
    source: 'Dados fictícios e determinísticos, apenas para demonstração.', noResults: 'Sem resultados',
    dataIntro: 'Fontes previstas para a versão com dados reais.',
    retry: 'Tentar de novo', loading: 'A carregar…',
  },
  en: {
    map: 'Map', indicators: 'Indicators', data: 'Data', searchPh: 'Search province, capital or lat, lon…',
    layers: 'Layers', ndvi: 'NDVI', temperature: 'Temperature', precipitation: 'Precipitation', population: 'Population',
    mortality: 'Mortality',
    pick: 'Select a location on the map or choose a province to start.',
    demo: 'Demo', near: 'Near', explore: 'Explore Angola', aiPh: 'Ask EarthPulse…',
    aiSoon: 'Assistant under development.', highlights: 'Highlights', byPlace: 'Indicator by capital',
    period: 'Period', highest: 'Highest value', lowest: 'Lowest value',
    close: 'Clear selection', minimize: 'Minimize', language: 'Language',
    source: 'Fictional, deterministic data for demonstration only.', noResults: 'No results',
    dataIntro: 'Planned sources for the real-data version.',
    retry: 'Try again', loading: 'Loading…',
  },
};

export const t = (lang: Lang, key: string): string => dict[lang][key] ?? key;

export const L = (lang: Lang, pt: string, en: string): string => (lang === 'pt' ? pt : en);

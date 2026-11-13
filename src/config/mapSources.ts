/** Fontes cartográficas. Trocar uma fonte exige alterar apenas este ficheiro. */

export const IMAGERY = {
  /** Visão global (NASA GIBS Blue Marble). */
  base: {
    tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'],
    maxzoom: 8,
    attribution: 'Imagery © NASA GIBS',
  },
  /** Detalhe de satélite ao aproximar (Sentinel-2 sem nuvens, EOX). Licença CC BY-NC 4.0: uso não comercial. */
  detail: {
    tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'],
    maxzoom: 13,
    attribution: 'Sentinel-2 cloudless © EOX (CC BY-NC 4.0)',
    fadeFrom: 3.2,
    fadeTo: 6,
  },
};

/** Ruas, edifícios e nomes de vias (OpenFreeMap, sem chave de API). Dados © OpenStreetMap contributors. */
export const VECTOR = {
  url: 'https://tiles.openfreemap.org/planet',
  attribution: '© OpenFreeMap · © OpenMapTiles · Dados © OpenStreetMap contributors',
  roadsMinZoom: 12,
  buildingsMinZoom: 13.5,
  namesMinZoom: 14,
};

export const COUNTRIES = {
  local: '/data/countries.geojson',
  remote: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  attribution: 'Limites © Natural Earth',
};

export type ProvinceSource =
  | { id: string; kind: 'url'; url: string; attribution: string }
  | { id: string; kind: 'geoboundaries-api'; url: string; attribution: string };

const GEOB_ATTR = 'Limites © geoBoundaries (CC BY 4.0)';
const GEOB_PATH = 'wmgeolab/geoBoundaries/main/releaseData/gbOpen/AGO/ADM1/geoBoundaries-AGO-ADM1_simplified.geojson';

/**
 * Cadeia de fontes das províncias, tentadas por ordem. Cada resposta é validada
 * (ver services/provinces.ts); a primeira válida é usada.
 */
export const PROVINCE_SOURCES: ProvinceSource[] = [
  { id: 'ficheiro-local', kind: 'url', url: '/data/angola-adm1.geojson', attribution: GEOB_ATTR },
  { id: 'geoboundaries-api', kind: 'geoboundaries-api', url: 'https://www.geoboundaries.org/api/current/gbOpen/AGO/ADM1/', attribution: GEOB_ATTR },
  { id: 'geoboundaries-media', kind: 'url', url: `https://media.githubusercontent.com/media/${GEOB_PATH}`, attribution: GEOB_ATTR },
  { id: 'geoboundaries-raw', kind: 'url', url: `https://raw.githubusercontent.com/${GEOB_PATH}`, attribution: GEOB_ATTR },
];

/** Número de províncias da divisão administrativa actual (a confirmar com a fonte dos limites). */
export const EXPECTED_PROVINCES = 21;

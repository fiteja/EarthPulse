/** Tipos geográficos partilhados: coordenadas, localizações, províncias e GeoJSON. */

export interface LatLon {
  lat: number;
  lon: number;
}

/** Província com um ponto representativo (centróide aproximado). */
export interface ProvinceRef extends LatLon {
  name: string;
}

/**
 * Localização escolhida pelo utilizador.
 * - "point": clique no mapa, pesquisa por coordenadas ou capital (abrangência de análise de 1 km).
 * - "province": província escolhida na pesquisa (sem área de 1 km).
 */
export interface Selection extends LatLon {
  kind: 'point' | 'province';
  name: string;
  province?: ProvinceRef;
}

/** GeoJSON mínimo, para não depender de pacotes extra. */
export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown> | null;
  geometry: { type: string; coordinates: unknown } | null;
}

export interface GeoCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

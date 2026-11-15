import type { ProvinceRef } from '../types/geography';

export interface Place {
  name: string;
  lat: number;
  lon: number;
  kind: 'capital' | 'province' | 'coords';
}

const capital = (name: string, lat: number, lon: number): Place => ({ name, lat, lon, kind: 'capital' });

// Capitais provinciais, coordenadas aproximadas (substituir por GeoNames / Natural Earth com atribuição).
export const PLACES: Place[] = [
  capital('Luanda', -8.839, 13.289), capital('Benguela', -12.576, 13.407),
  capital('Huambo', -12.776, 15.739), capital('Lubango', -14.917, 13.493),
  capital('Malanje', -9.54, 16.341), capital('Cabinda', -5.55, 12.2),
  capital('Uíge', -7.608, 15.061), capital('Saurimo', -9.661, 20.391),
  capital('Menongue', -14.658, 17.691), capital('Moçâmedes', -15.196, 12.152),
  capital("N'dalatando", -9.296, 14.912), capital('Caxito', -8.578, 13.664),
  capital('Sumbe', -11.206, 13.844), capital('Kuito', -12.383, 16.934),
  capital('Luena', -11.783, 19.917), capital("M'banza Kongo", -6.268, 14.243),
  capital('Ondjiva', -17.066, 15.733), capital('Dundo', -7.367, 20.833),
];

/** Províncias carregadas dos limites geográficos (preenchido por registerProvinces). */
let provincePlaces: Place[] = [];

export function registerProvinces(refs: ProvinceRef[]): void {
  provincePlaces = refs.map((p) => ({ name: p.name, lat: p.lat, lon: p.lon, kind: 'province' }));
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const COORDS = /^\s*(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)\s*$/;

/** Pesquisa por coordenadas ("lat, lon"), província ou capital. */
export function searchPlaces(q: string): Place[] {
  const m = q.match(COORDS);
  if (m) {
    const lat = parseFloat(m[1].replace(',', '.'));
    const lon = parseFloat(m[2].replace(',', '.'));
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return [{ name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, lat, lon, kind: 'coords' }];
    }
  }
  const n = norm(q.trim());
  if (!n) return [];
  const seen = new Set<string>();
  // Capitais primeiro: têm coordenadas precisas da cidade.
  return [...PLACES, ...provincePlaces].filter((p) => {
    const key = norm(p.name);
    if (!key.includes(n) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function nearest(lat: number, lon: number): Place {
  return PLACES.reduce((a, b) =>
    (a.lat - lat) ** 2 + (a.lon - lon) ** 2 < (b.lat - lat) ** 2 + (b.lon - lon) ** 2 ? a : b
  );
}

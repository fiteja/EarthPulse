/** Configuração do globo: câmara, rotação e área de análise. */
export const GLOBE = {
  center: [17, 2] as [number, number],
  bearing: -23.4, // inclinação axial real da Terra
  pitch: 0,
  degPerSec: 4,
  rotationMaxZoom: 3.8,
  rotationResumeZoom: 3.4,
  idleResumeMs: 5000,
  angola: { lat: -12.3, lon: 17.5, zoom: 4.4 },
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

/** Ecrãs largos têm painéis laterais: o globo é centrado na área livre. */
export const WIDE_BREAKPOINT = 1100;
export const MOBILE_BREAKPOINT = 767;

export interface Padding { top: number; bottom: number; left: number; right: number }

export function basePadding(): Padding {
  return window.innerWidth >= WIDE_BREAKPOINT
    ? { top: 40, bottom: 170, left: 60, right: 360 }
    : { top: 0, bottom: 0, left: 0, right: 0 };
}

/** Zoom em que o globo inteiro cabe na área livre do ecrã (com margem). */
export function worldZoom(): number {
  const p = basePadding();
  const w = window.innerWidth - p.left - p.right;
  const h = window.innerHeight - p.top - p.bottom;
  const diameter = Math.max(220, Math.min(w, h)) * 0.86;
  // Diâmetro do globo em pixéis ≈ 512 · 2^zoom / π
  return Math.max(0.6, Math.log2((diameter * Math.PI) / 512));
}

/** Abrangência de análise de um ponto. Quadrado de 1 km × 1 km (1 km²) por omissão. */
export const ANALYSIS = {
  shape: 'square' as 'square' | 'circle',
  sideKm: 1,
  radiusKm: 1,
  /** Zoom da aproximação a um ponto, para que a área de 1 km fique bem visível. */
  zoom: 14,
  pitch: 50,
};

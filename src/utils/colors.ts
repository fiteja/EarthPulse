const toRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** Cor da escala (`ramp`) para t entre 0 e 1, por interpolação linear em RGB. */
export function rampColor(ramp: string[], t: number): string {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = toRgb(ramp[i]);
  const b = toRgb(ramp[i + 1]);
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Gradiente CSS para a barra da legenda. */
export const rampGradient = (ramp: string[]) => `linear-gradient(90deg, ${ramp.join(', ')})`;

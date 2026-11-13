import { META } from '../config/indicators';
import type { IndicatorId } from '../types/indicators';

export const locale = (lang: string) => (lang === 'pt' ? 'pt-AO' : 'en-US');

export function fmtNumber(value: number, decimals: number, lang: string): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(locale(lang), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Valor de um indicador com o número de casas decimais próprio. */
export const fmt = (value: number, id: IndicatorId, lang: string) => fmtNumber(value, META[id].decimals, lang);

export const fmtCoord = (value: number, lang: string, decimals = 4) => fmtNumber(value, decimals, lang);

export function fmtPercent(value: number, lang: string): string {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${fmtNumber(value, 1, lang)} %`;
}

export const mean = (values: number[]): number => {
  const ok = values.filter(Number.isFinite);
  return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : NaN;
};

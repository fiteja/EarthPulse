import { YEARS } from '../../config/indicators';
import { Lang, t } from '../../i18n';
import type { IndicatorId, IndicatorSeriesPoint } from '../../types/indicators';
import { fmt } from '../../utils/format';

interface ScaleResult { lo: number; span: number }

const scale = (vals: number[]): ScaleResult => {
  const ok = vals.filter(Number.isFinite);
  const lo = Math.min(...ok);
  return { lo, span: Math.max(...ok) - lo || 1 };
};

/** Gráfico pequeno do painel do ponto: uma série ao longo dos anos. */
export function MiniChart({ series, ind, lang }: { series: IndicatorSeriesPoint[]; ind: IndicatorId; lang: Lang }) {
  const vals = series.map((s) => s.value);
  if (series.length < 2 || !vals.every(Number.isFinite)) return null;
  const { lo, span } = scale(vals);
  const xy = vals.map((v, i) => [24 + i * (252 / (vals.length - 1)), 78 - ((v - lo) / span) * 50]);
  return (
    <svg viewBox="0 0 300 100" className="mini" role="img" aria-label={t(lang, ind)}>
      <polyline points={xy.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#7fe3f5" strokeWidth="2" />
      {xy.map(([x, y], i) => (
        <g key={series[i].year}>
          <circle cx={x} cy={y} r="3" fill="#fff" />
          <text x={x} y="96" textAnchor="middle">{series[i].year}</text>
          <text x={x} y={y - 8} textAnchor="middle" className="v">{fmt(vals[i], ind, lang)}</text>
        </g>
      ))}
    </svg>
  );
}

/** Gráfico grande das páginas: evolução da média ao longo de YEARS. */
export function TrendChart({ vals, ind, lang }: { vals: number[]; ind: IndicatorId; lang: Lang }) {
  if (vals.length < 2 || !vals.every(Number.isFinite)) return null;
  const { lo, span } = scale(vals);
  const xy = vals.map((v, i) => [40 + i * (320 / (vals.length - 1)), 125 - ((v - lo) / span) * 85]);
  const pts = xy.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <svg viewBox="0 0 400 165" className="chart" role="img" aria-label={t(lang, ind)}>
      {[0, 1, 2].map((i) => <line key={i} x1="20" x2="380" y1={40 + i * 42} y2={40 + i * 42} />)}
      <polygon points={`40,125 ${pts} 360,125`} className="area" />
      <polyline points={pts} className="ln" />
      {xy.map(([x, y], i) => (
        <g key={YEARS[i]}>
          <circle cx={x} cy={y} r="4" />
          <text x={x} y="148" textAnchor="middle">{YEARS[i]}</text>
          <text x={x} y={y - 10} textAnchor="middle" className="v">{fmt(vals[i], ind, lang)}</text>
        </g>
      ))}
    </svg>
  );
}

/** Linha mínima, sem eixos, para visões gerais. */
export function Sparkline({ vals, label }: { vals: number[]; label: string }) {
  if (vals.length < 2 || !vals.every(Number.isFinite)) return null;
  const { lo, span } = scale(vals);
  const pts = vals.map((v, i) => `${4 + i * (112 / (vals.length - 1))},${34 - ((v - lo) / span) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 120 40" className="spark" role="img" aria-label={label}>
      <polyline points={pts} />
    </svg>
  );
}

/** Lista de barras horizontais ordenada, para rankings. */
export function BarList({ rows, ind, lang }: { rows: { name: string; value: number }[]; ind: IndicatorId; lang: Lang }) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return (
    <>
      {rows.map((r) => (
        <div key={r.name} className="line">
          <span title={r.name}>{r.name}</span>
          <i><u style={{ width: `${(r.value / max) * 100}%` }} /></i>
          <b>{fmt(r.value, ind, lang)}</b>
        </div>
      ))}
    </>
  );
}

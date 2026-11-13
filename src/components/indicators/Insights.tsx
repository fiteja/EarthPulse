import { AlertTriangle, ArrowUpRight, Info, Leaf, Sparkles, Thermometer } from 'lucide-react';
import { META, YEARS } from '../../config/indicators';
import { useCapitalsTable } from '../../hooks/useData';
import { L, Lang, t } from '../../i18n';
import type { Place } from '../../services/places';
import type { IndicatorId } from '../../types/indicators';
import { fmt } from '../../utils/format';
import { DemoChip } from '../ui/DemoChip';

interface Props { lang: Lang; ind: IndicatorId; year: number; onPlace: (p: Place) => void; flow?: boolean }

export function Insights({ lang, ind, year, onPlace, flow }: Props) {
  const table = useCapitalsTable(ind);
  const yi = YEARS.indexOf(year);
  const rows = (table.data ?? [])
    .map((r) => ({ p: { name: r.name, lat: r.lat, lon: r.lon, kind: 'capital' } as Place, v: r.values[yi] }))
    .filter((r) => Number.isFinite(r.v))
    .sort((a, b) => b.v - a.v);
  if (rows.length === 0) return null;

  const items = [
    { h: L(lang, 'Valor mais alto', 'Highest value'), r: rows[0], Icon: Leaf, tip: AlertTriangle, txt: L(lang, 'Acima da média nacional', 'Above national mean') },
    { h: L(lang, 'Valor mais baixo', 'Lowest value'), r: rows[rows.length - 1], Icon: Thermometer, tip: AlertTriangle, txt: L(lang, 'Merece monitorização', 'Worth monitoring') },
    { h: L(lang, 'Recomendação', 'Recommendation'), r: rows[Math.floor(rows.length / 2)], Icon: Sparkles, tip: Info, txt: L(lang, 'Comparar com o período anterior', 'Compare with previous period') },
  ];
  return (
    <aside className={flow ? 'insights flow' : 'insights'}>
      <header><Sparkles size={18} /> {t(lang, 'highlights')} <DemoChip lang={lang} /></header>
      {items.map(({ h, r, Icon, tip: Tip, txt }) => (
        <section key={h}>
          <h4>{h}</h4>
          <button className="tile" onClick={() => onPlace(r.p)}>
            <ArrowUpRight className="ar" size={18} />
            <Icon className="art" size={64} strokeWidth={1} />
            <small>{L(lang, 'Capital', 'Capital')}</small>
            <b>{r.p.name} · {fmt(r.v, ind, lang)} {META[ind].unit}</b>
            <span className="warn"><Tip size={16} /> {txt}</span>
          </button>
        </section>
      ))}
    </aside>
  );
}

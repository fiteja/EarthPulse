import { ArrowUpRight } from 'lucide-react';
import { META, YEARS } from '../../config/indicators';
import { useCapitalsTable } from '../../hooks/useData';
import { L, Lang, t } from '../../i18n';
import type { IndicatorId } from '../../types/indicators';
import { fmt, mean } from '../../utils/format';
import { Skeleton, StateBox } from '../ui/StateBox';

interface Props { lang: Lang; ind: IndicatorId; year: number; setYear: (y: number) => void; onOpen: () => void; flow?: boolean }

export function BottomCards({ lang, ind, year, setYear, onOpen, flow }: Props) {
  const table = useCapitalsTable(ind);
  const cls = flow ? 'cards flow' : 'cards';

  if (table.status === 'error') {
    return <section className={cls}><article className="card"><StateBox kind="error" lang={lang} text={table.error?.message ?? ''} onRetry={table.retry} /></article></section>;
  }
  if (!table.data) return <section className={cls}><article className="card"><Skeleton /></article></section>;

  const yi = YEARS.indexOf(year);
  const rows = table.data
    .map((r) => ({ name: r.name, v: r.values[yi] }))
    .filter((r) => Number.isFinite(r.v))
    .sort((a, b) => b.v - a.v);
  if (rows.length === 0) {
    return <section className={cls}><article className="card"><StateBox kind="empty" lang={lang} text={L(lang, 'Sem dados para este período.', 'No data for this period.')} /></article></section>;
  }
  const avg = mean(rows.map((r) => r.v));
  const max = rows[0].v || 1;
  const Arrow = () => <button className="round arrow" onClick={onOpen} aria-label={t(lang, 'indicators')}><ArrowUpRight size={18} /></button>;

  return (
    <section className={cls}>
      <article className="card">
        <Arrow />
        <h3>{t(lang, 'byPlace')}</h3>
        <p className="big">{fmt(avg, ind, lang)} <small>{META[ind].unit} · {L(lang, 'média', 'mean')}</small></p>
        <div className="cols">
          {rows.slice(0, 5).map((r) => (
            <div key={r.name}><i className="dots" style={{ height: `${(r.v / max) * 100}%` }} /><span>{r.name.slice(0, 7)}</span></div>
          ))}
        </div>
      </article>
      <article className="card">
        <Arrow />
        <h3>{t(lang, 'period')}</h3>
        <div className="timeline">
          {YEARS.map((y, i) => (
            <button key={y} className={y === year ? 'on' : ''} onClick={() => setYear(y)}>
              <span className="pill">{y}</span>
              <b>{fmt(mean(table.data!.map((r) => r.values[i])), ind, lang)}</b>
              <small>{L(lang, 'média', 'mean')}</small>
            </button>
          ))}
        </div>
      </article>
      <article className="card">
        <Arrow />
        <h3>{L(lang, 'Ranking', 'Ranking')}</h3>
        {rows.slice(0, 6).map((r) => (
          <div key={r.name} className="line"><span>{r.name}</span><i><u style={{ width: `${(r.v / max) * 100}%` }} /></i><b>{fmt(r.v, ind, lang)}</b></div>
        ))}
      </article>
    </section>
  );
}

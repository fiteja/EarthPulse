import { BottomCards } from '../components/comparison/BottomCards';
import { BarList, Sparkline, TrendChart } from '../components/indicators/Charts';
import { Insights } from '../components/indicators/Insights';
import { DemoChip } from '../components/ui/DemoChip';
import { Skeleton, StateBox } from '../components/ui/StateBox';
import { IDS, META, YEARS, describe, resolutionLabel, scaleOf } from '../config/indicators';
import { useCapitalsTable, useProvinceValues } from '../hooks/useData';
import { L, Lang, t } from '../i18n';
import type { Place } from '../services/places';
import type { ProvincesResult } from '../services/provinces';
import type { IndicatorId } from '../types/indicators';
import { fmt, fmtPercent, mean } from '../utils/format';

interface Props {
  lang: Lang;
  ind: IndicatorId;
  setInd: (i: IndicatorId) => void;
  year: number;
  setYear: (y: number) => void;
  provinces: ProvincesResult | null;
  onPlace: (p: Place) => void;
}

const changeOf = (vals: number[]) => ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100;

/** Cartão de visão geral: evolução da média de um indicador. */
function OverviewCard({ id, lang, active, onSelect }: { id: IndicatorId; lang: Lang; active: boolean; onSelect: () => void }) {
  const table = useCapitalsTable(id);
  const means = table.data ? YEARS.map((_, i) => mean(table.data!.map((r) => r.values[i]))) : [];
  return (
    <button className={`card overview${active ? ' on' : ''}`} aria-pressed={active} onClick={onSelect}>
      <small>{t(lang, id)}</small>
      {means.length ? (
        <>
          <b>{fmt(means[means.length - 1], id, lang)} <em>{META[id].unit}</em></b>
          <Sparkline vals={means} label={t(lang, id)} />
          <small>{fmtPercent(changeOf(means), lang)} · {YEARS[0]}–{YEARS[YEARS.length - 1]}</small>
        </>
      ) : <Skeleton lines={2} />}
    </button>
  );
}

export function IndicatorsPage({ lang, ind, setInd, year, setYear, provinces, onPlace }: Props) {
  const table = useCapitalsTable(ind);
  const byProvince = useProvinceValues(ind, year, provinces);
  const yi = YEARS.indexOf(year);
  const means = table.data ? YEARS.map((_, i) => mean(table.data!.map((r) => r.values[i]))) : [];
  const current = table.data ? table.data.map((r) => r.values[yi]).filter(Number.isFinite) : [];

  const stats: [string, string][] = means.length
    ? [
        [L(lang, 'Média das capitais', 'Capitals mean'), fmt(mean(current), ind, lang)],
        [L(lang, 'Máximo', 'Maximum'), fmt(Math.max(...current), ind, lang)],
        [L(lang, 'Mínimo', 'Minimum'), fmt(Math.min(...current), ind, lang)],
        [L(lang, 'Variação 2021–2025', 'Change 2021–2025'), fmtPercent(changeOf(means), lang)],
      ]
    : [];
  const provRows = Object.entries(byProvince.data ?? {})
    .filter(([, v]) => Number.isFinite(v))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <main className="page">
      <header className="phead">
        <h1>{t(lang, 'indicators')}</h1>
        <p>{L(lang, 'Evolução, comparação e leitura de cada indicador.', 'Trends, comparison and reading of each indicator.')}</p>
        <DemoChip lang={lang} />
      </header>

      <div className="overview-grid">
        {IDS.map((id) => <OverviewCard key={id} id={id} lang={lang} active={id === ind} onSelect={() => setInd(id)} />)}
      </div>

      {table.status === 'error' && <StateBox kind="error" lang={lang} text={table.error?.message ?? ''} onRetry={table.retry} />}
      <div className="stats">
        {stats.map(([a, b]) => (
          <article key={a} className="card">
            <small>{a}</small>
            <p className="big">{b}<small> {a.startsWith(L(lang, 'Variação', 'Change')) ? '' : META[ind].unit}</small></p>
          </article>
        ))}
      </div>

      <div className="grid">
        <article className="card">
          <h3>{L(lang, 'Evolução da média das capitais 2021–2025', 'Capitals mean trend 2021–2025')}</h3>
          <TrendChart vals={means} ind={ind} lang={lang} />
        </article>
        <article className="card">
          <h3>{L(lang, 'Sobre o indicador', 'About the indicator')} · {t(lang, ind)}</h3>
          <p>{describe(ind, lang)}</p>
          <p><small>{L(lang, 'Escala', 'Scale')}</small><br />{scaleOf(ind, lang)}</p>
          <p><small>{L(lang, 'Fonte prevista', 'Planned source')}</small><br />{META[ind].source}</p>
          <p><small>{L(lang, 'Resolução espacial', 'Spatial resolution')}</small><br />{resolutionLabel(ind, lang)}</p>
          <p><small>{L(lang, 'Limitação', 'Limitation')}</small><br />{META[ind].limitation[lang === 'pt' ? 0 : 1]}</p>
        </article>
      </div>

      <article className="card">
        <h3>{L(lang, `Ranking por província · ${year}`, `Ranking by province · ${year}`)}</h3>
        {byProvince.status === 'error' && <StateBox kind="error" lang={lang} text={byProvince.error?.message ?? ''} onRetry={byProvince.retry} />}
        {!provinces && byProvince.status !== 'error' && (
          <StateBox kind="empty" lang={lang} text={L(lang, 'Os limites das províncias ainda não foram carregados.', 'Province boundaries have not been loaded yet.')} />
        )}
        {provRows.length > 0 && <div className="two-col"><BarList rows={provRows} ind={ind} lang={lang} /></div>}
      </article>

      <BottomCards flow lang={lang} ind={ind} year={year} setYear={setYear} onOpen={() => undefined} />
      <Insights flow lang={lang} ind={ind} year={year} onPlace={onPlace} />
    </main>
  );
}

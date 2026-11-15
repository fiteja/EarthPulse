import { useEffect, useState } from 'react';
import { Check, ChevronUp, Copy, Download, X } from 'lucide-react';
import { ANALYSIS } from '../../config/globe';
import { IDS, META, YEARS } from '../../config/indicators';
import { useCapitalsTable, useLocationData } from '../../hooks/useData';
import { L, Lang, t } from '../../i18n';
import { dataService } from '../../services/dataService';
import type { Selection } from '../../types/geography';
import type { IndicatorId } from '../../types/indicators';
import { analysisAreaKm2 } from '../../utils/geo';
import { copyText } from '../../utils/clipboard';
import { downloadCsv } from '../../utils/csv';
import { fmt, fmtCoord, fmtPercent, mean } from '../../utils/format';
import { valueAt } from '../../utils/series';
import { YearSelector } from '../timeline/YearSelector';
import { DemoChip } from '../ui/DemoChip';
import { Skeleton, StateBox } from '../ui/StateBox';
import { MiniChart } from './Charts';
import { ProvenanceList } from './ProvenanceList';

interface Props {
  lang: Lang;
  sel: Selection | null;
  ind: IndicatorId;
  setInd: (i: IndicatorId) => void;
  year: number;
  setYear: (y: number) => void;
  mobile: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function DataPanel({ lang, sel, ind, setInd, year, setYear, mobile, onClose, onOpen }: Props) {
  const loc = useLocationData(sel);
  const capitals = useCapitalsTable(ind);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cada nova selecção volta ao cartão compacto (telemóvel).
  useEffect(() => {
    setOpen(false);
    setCopied(false);
  }, [sel?.lat, sel?.lon]);

  if (!sel) {
    if (mobile) return null; // no telemóvel o painel só aparece quando há selecção
    return (
      <aside className="dpanel card">
        <h3>{L(lang, 'Ponto selecionado', 'Selected point')}</h3>
        <p className="muted">{t(lang, 'pick')}</p>
        {/* <DemoChip lang={lang} /> */}
      </aside>
    );
  }

  const data = loc.data && loc.data.lat === sel.lat && loc.data.lon === sel.lon ? loc.data : null;
  const series = data?.indicators[ind]?.series ?? [];
  const hasAny = data ? IDS.some((id) => data.indicators[id]?.series.length > 0) : false;
  const cur = valueAt(series, year);
  const yi = YEARS.indexOf(year);
  const capMean = capitals.data ? mean(capitals.data.map((r) => r.values[yi])) : NaN;
  const diff = Number.isFinite(cur) && Number.isFinite(capMean) ? ((cur - capMean) / capMean) * 100 : NaN;
  const title = sel.province?.name ?? sel.name;
  const coordText = `${sel.lat.toFixed(5)}, ${sel.lon.toFixed(5)}`;

  const copy = async () => {
    setCopied(await copyText(coordText));
    window.setTimeout(() => setCopied(false), 2000);
  };

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`earthpulse_${sel.lat.toFixed(3)}_${sel.lon.toFixed(3)}.csv`, [
      ['indicator', 'unit', ...YEARS],
      ...IDS.map((id) => [id, META[id].unit, ...YEARS.map((y) => valueAt(data.indicators[id]?.series, y).toFixed(3))]),
    ]);
  };

  return (
    <aside className={`dpanel card${mobile ? ' sheet' : ''}${open ? ' open' : ''}`} aria-busy={!data && loc.status !== 'error'}>
      {mobile && (
        <button className="grab" aria-expanded={open} aria-label={L(lang, 'Expandir detalhes', 'Expand details')} onClick={() => setOpen(!open)}>
          <ChevronUp size={18} />
        </button>
      )}
      <button className="round close" aria-label={t(lang, 'close')} onClick={onClose}><X size={18} /></button>
      <small>{sel.kind === 'province' ? L(lang, 'Província selecionada', 'Selected province') : L(lang, 'Ponto selecionado', 'Selected point')}</small>
      <h2>{title}</h2>
      <div className="coord2">
        <div><small>Latitude</small><b>{fmtCoord(sel.lat, lang)}°</b></div>
        <div><small>Longitude</small><b>{fmtCoord(sel.lon, lang)}°</b></div>
      </div>
      <button className="copy" onClick={copy} aria-live="polite" title={L(lang, 'Copiar lat/long', 'Copy lat/long')}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span className="lbl">{copied ? L(lang, 'Copiado', 'Copied') : L(lang, 'Copiar lat/long', 'Copy lat/long')}</span>
      </button>

      {loc.status === 'error' && <StateBox kind="error" lang={lang} text={loc.error?.message ?? t(lang, 'loading')} onRetry={loc.retry} />}
      {!data && loc.status !== 'error' && <Skeleton lines={6} />}
      {data && !hasAny && (
        <StateBox kind="empty" lang={lang} text={L(lang, 'Sem dados disponíveis para esta localização.', 'No data available for this location.')} />
      )}

      {data && hasAny && (
        <>
          <div className="kpis">
            {IDS.map((id) => (
              <button key={id} className={id === ind ? 'kpi on' : 'kpi'} aria-pressed={id === ind} onClick={() => setInd(id)}>
                <small>{t(lang, id)}</small>
                <strong>{fmt(valueAt(data.indicators[id]?.series, year), id, lang)}<em>{META[id].unit}</em></strong>
              </button>
            ))}
          </div>
          <div className="more">
            <YearSelector year={year} setYear={setYear} />
            <small>
              {sel.kind === 'point' && data.areaKm2 !== null
                ? `${L(lang, 'Área de análise', 'Analysis area')}: ${ANALYSIS.shape === 'circle' ? `${L(lang, 'raio', 'radius')} ${ANALYSIS.radiusKm} km` : `${ANALYSIS.sideKm} × ${ANALYSIS.sideKm} km`} (${fmtCoord(analysisAreaKm2(), lang, 2)} km²)`
                : L(lang, 'Valores ao nível da província.', 'Province-level values.')}
              {META[ind].spatialResolution === 'province' && sel.kind === 'point' && ` · ${t(lang, ind)}: ${L(lang, 'valor da província', 'province value')}`}
            </small>
            {sel.kind === 'point' && <small className="block">{t(lang, 'near')}: {sel.name}</small>}
            <MiniChart series={series} ind={ind} lang={lang} />
            {Number.isFinite(diff) && (
              <p className="cmp"><b>{fmtPercent(diff, lang)}</b> {L(lang, 'face à média das capitais', 'vs capitals mean')}</p>
            )}
            <ProvenanceList lang={lang} ind={ind} provenance={data.indicators[ind]?.provenance} />
            {/* <p className="note"><DemoChip lang={lang} /> {dataService.isDemo && `ⓘ ${t(lang, 'source')}`}</p> */}
            <div className="acts">
              <button onClick={exportCsv}><Download size={16} /> CSV</button>
              <button onClick={onOpen}>{t(lang, 'indicators')}</button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

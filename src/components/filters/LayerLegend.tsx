import { X } from 'lucide-react';
import { META, resolutionLabel } from '../../config/indicators';
import { L, Lang, t } from '../../i18n';
import type { LoadStatus } from '../../types/api';
import type { IndicatorId } from '../../types/indicators';
import { fmt } from '../../utils/format';
import { rampGradient } from '../../utils/colors';
import { YearSelector } from '../timeline/YearSelector';
import { DemoChip } from '../ui/DemoChip';
import { StateBox } from '../ui/StateBox';

interface Props {
  lang: Lang;
  layer: IndicatorId;
  year: number;
  setYear: (y: number) => void;
  status: LoadStatus;
  onRetry: () => void;
  onRemove: () => void;
}

/** Legenda da camada activa: escala de cores, unidade, período, resolução e botão para remover o filtro. */
export function LayerLegend({ lang, layer, year, setYear, status, onRetry, onRemove }: Props) {
  const m = META[layer];
  return (
    <aside className="card legend" aria-label={L(lang, 'Legenda da camada', 'Layer legend')}>
      <h4>{t(lang, layer)} {m.unit && <small>({m.unit})</small>}</h4>
      <div className="grad" style={{ background: rampGradient(m.ramp) }} role="img"
        aria-label={`${fmt(m.min, layer, lang)} – ${fmt(m.max, layer, lang)} ${m.unit}`} />
      <div className="row"><span>{fmt(m.min, layer, lang)}</span><span>{fmt(m.max, layer, lang)}</span></div>
      <YearSelector year={year} setYear={setYear} />
      <small className="muted">
        {L(lang, 'Média por província', 'Mean by province')} · {L(lang, 'Resolução da fonte', 'Source resolution')}: {resolutionLabel(layer, lang)}
      </small>
      {status === 'error' && <StateBox kind="error" lang={lang} text={L(lang, 'Sem dados para esta camada.', 'No data for this layer.')} onRetry={onRetry} />}
      {/* <div className="row"><DemoChip lang={lang} /></div> */}
      <button className="rm" onClick={onRemove}><X size={14} /> {L(lang, 'Remover filtro', 'Remove filter')}</button>
    </aside>
  );
}

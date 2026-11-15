import { META, provenanceOf, resolutionLabel } from '../../config/indicators';
import { L, Lang } from '../../i18n';
import type { IndicatorId, Provenance } from '../../types/indicators';

interface Props { lang: Lang; ind: IndicatorId; provenance?: Provenance }

/** Fonte, dataset, período, resolução e limitação do indicador mostrado. */
export function ProvenanceList({ lang, ind, provenance }: Props) {
  const p = provenance ?? provenanceOf(ind, lang);
  return (
    <dl className="src">
      <dt>{L(lang, 'Fonte / dataset', 'Source / dataset')}</dt><dd>{p.source} · {p.dataset}</dd>
      <dt>{L(lang, 'Período', 'Period')}</dt><dd>{p.period} · {p.unit}</dd>
      <dt>{L(lang, 'Resolução espacial', 'Spatial resolution')}</dt><dd>{resolutionLabel(ind, lang)}</dd>
      <dt>{L(lang, 'Limitação', 'Limitation')}</dt><dd>{p.limitation}</dd>
      {META[ind].frequency !== '—' && (<><dt>{L(lang, 'Frequência', 'Frequency')}</dt><dd>{META[ind].frequency}</dd></>)}
    </dl>
  );
}

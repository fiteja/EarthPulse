import { AppWindow, Database, Satellite, Server, Workflow } from 'lucide-react';
import { DemoChip } from '../components/ui/DemoChip';
import { StateBox } from '../components/ui/StateBox';
import { API_BASE_URL } from '../config/env';
import { ENDPOINTS } from '../config/endpoints';
import { IDS, META, resolutionLabel } from '../config/indicators';
import { COUNTRIES, IMAGERY, VECTOR } from '../config/mapSources';
import { L, Lang, t } from '../i18n';
import { dataService } from '../services/dataService';
import type { ProvincesResult } from '../services/provinces';
import type { LoadState } from '../types/api';

const STEPS = [
  { Icon: Satellite, n: 'NASA', d: ['Earthdata, GIBS e SEDAC', 'Earthdata, GIBS and SEDAC'] },
  { Icon: Workflow, n: 'Python', d: ['Ingestão e tratamento', 'Ingestion and processing'] },
  { Icon: Database, n: 'PostGIS', d: ['Base de dados espacial', 'Spatial database'] },
  { Icon: Server, n: 'FastAPI', d: ['API /api/v1', 'API /api/v1'] },
  { Icon: AppWindow, n: 'React', d: ['Mapa e painéis', 'Map and panels'] },
] as const;

const sizeLabel = (m: number) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

interface Props { lang: Lang; provinces: LoadState<ProvincesResult> }

export function DataPage({ lang, provinces }: Props) {
  const gridIds = IDS.filter((id) => META[id].gridMeters !== null);
  const resolutionRows = gridIds.map((id) => ({ name: t(lang, id), value: Math.log10(META[id].gridMeters as number) }));
  const p = provinces.data;
  const licenses = [
    [IMAGERY.base.attribution, 'NASA GIBS'],
    [IMAGERY.detail.attribution, L(lang, 'Uso não comercial', 'Non-commercial use')],
    [VECTOR.attribution, 'ODbL (OpenStreetMap)'],
    [COUNTRIES.attribution, L(lang, 'Domínio público', 'Public domain')],
  ];

  return (
    <main className="page">
      <header className="phead">
        <h1>{t(lang, 'data')}</h1>
        <p>{L(lang, 'De onde virão os dados e como chegam à interface.', 'Where the data will come from and how it reaches the interface.')}</p>
        <DemoChip lang={lang} /> {dataService.isDemo && <small>{t(lang, 'source')}</small>}
      </header>

      <article className="card">
        <h3>Pipeline</h3>
        <div className="pipe">
          {STEPS.map(({ Icon, n, d }, i) => (
            <div key={n} className="step" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="round"><Icon size={20} /></span><b>{n}</b><small>{d[lang === 'pt' ? 0 : 1]}</small>
            </div>
          ))}
        </div>
      </article>

      <div className="grid">
        <article className="card">
          <h3>{L(lang, 'Indicadores e datasets', 'Indicators and datasets')}</h3>
          <table>
            <thead>
              <tr><th>{t(lang, 'indicators')}</th><th>Dataset</th><th>{L(lang, 'Resolução', 'Resolution')}</th><th>{L(lang, 'Frequência', 'Frequency')}</th></tr>
            </thead>
            <tbody>
              {IDS.map((id) => (
                <tr key={id}><td>{t(lang, id)}</td><td>{META[id].dataset}</td><td>{resolutionLabel(id, lang)}</td><td>{META[id].frequency}</td></tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="card">
          <h3>{L(lang, 'Resolução da grelha (escala log)', 'Grid resolution (log scale)')}</h3>
          {resolutionRows.map((r) => (
            <div key={r.name} className="line">
              <span>{r.name}</span>
              <i><u style={{ width: `${(r.value / Math.log10(11000)) * 100}%` }} /></i>
              <b>{sizeLabel(10 ** r.value)}</b>
            </div>
          ))}
          <small className="muted">{L(lang, 'A mortalidade não é de grelha: a sua resolução é por província.', 'Mortality is not gridded: its resolution is per province.')}</small>
        </article>
      </div>

      <div className="grid two">
        <article className="card">
          <h3>{L(lang, 'Estado da integração', 'Integration status')}</h3>
          <p>
            {L(lang, 'Origem dos dados', 'Data source')}: <b>{dataService.kind === 'mock' ? L(lang, 'demonstrativa (mock)', 'demo (mock)') : `API · ${API_BASE_URL}`}</b>
          </p>
          <small className="muted">{L(lang, 'Endpoints previstos (por confirmar com o backend)', 'Planned endpoints (to be confirmed with the backend)')}</small>
          <table>
            <tbody>
              {Object.values(ENDPOINTS).map((e) => (
                <tr key={e.path}><td><code>{e.method} {e.path}</code></td><td>{e.purpose}</td></tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="card">
          <h3>{L(lang, 'Limites das províncias', 'Province boundaries')}</h3>
          {provinces.status === 'error' && <StateBox kind="error" lang={lang} text={provinces.error?.message ?? ''} onRetry={provinces.retry} />}
          {p && (
            <>
              <p>{L(lang, 'Fonte', 'Source')}: <b>{p.sourceId}</b> · {p.attribution}</p>
              <p>{L(lang, 'Províncias carregadas', 'Provinces loaded')}: <b>{p.count}</b> / {p.expected}</p>
              {p.mismatch && (
                <StateBox
                  kind="empty"
                  lang={lang}
                  text={L(lang, `A fonte tem ${p.count} províncias, mas a divisão actual tem ${p.expected}. Pode ser uma versão anterior dos limites: confirmar com a equipa.`, `The source has ${p.count} provinces but the current division has ${p.expected}. It may be an older version of the boundaries: confirm with the team.`)}
                />
              )}
            </>
          )}
          <h3>{L(lang, 'Mapas e licenças', 'Maps and licences')}</h3>
          <table><tbody>{licenses.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
        </article>
      </div>

      <div className="grid two">
        <article className="card">
          <h3>{L(lang, 'Metodologia', 'Methodology')}</h3>
          <p>{L(lang, 'Cada valor terá fonte, dataset, período, unidade e nota de limitação. As médias por província resultam de agregação espacial dos pixéis.', 'Each value will carry source, dataset, period, unit and a limitation note. Province means come from spatial aggregation of pixels.')}</p>
        </article>
        <article className="card">
          <h3>{L(lang, 'Limitações', 'Limitations')}</h3>
          <p>{L(lang, 'Nesta versão todos os valores são fictícios e determinísticos. Não representam medições reais da NASA.', 'In this version all values are fictional and deterministic. They are not real NASA measurements.')}</p>
        </article>
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { AiBar } from '../components/ai/AiBar';
import { LayerLegend } from '../components/filters/LayerLegend';
import { IndicatorRail } from '../components/filters/IndicatorRail';
import { FlyTarget, GlobeMap } from '../components/globe/GlobeMap';
import { DataPanel } from '../components/indicators/DataPanel';
import { TopBar } from '../components/layout/TopBar';
import { StateBox } from '../components/ui/StateBox';
import { ANALYSIS, GLOBE, worldZoom } from '../config/globe';
import { useChoropleth, useProvinces } from '../hooks/useData';
import { useIsMobile } from '../hooks/useIsMobile';
import { L, Lang } from '../i18n';
import { Place, nearest, registerProvinces } from '../services/places';
import { provinceAt } from '../services/provinces';
import type { Selection } from '../types/geography';
import type { IndicatorId } from '../types/indicators';
import { inAngolaBounds } from '../utils/geo';
import { DataPage } from './DataPage';
import { IndicatorsPage } from './IndicatorsPage';

export type Tab = 'map' | 'indicators' | 'data';

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('map');
  const [lang, setLang] = useState<Lang>('pt');
  const [ind, setInd] = useState<IndicatorId>('ndvi');
  const [layer, setLayer] = useState<IndicatorId | null>(null); // indicador que colore o globo
  const [year, setYear] = useState(2025);
  const [sel, setSel] = useState<Selection | null>(null);
  const [fly, setFly] = useState<FlyTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const mobile = useIsMobile();
  const provinces = useProvinces();
  const choropleth = useChoropleth(layer, year, provinces.data);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (provinces.data) registerProvinces(provinces.data.refs);
    else if (provinces.error) console.warn(provinces.error.message);
  }, [provinces.data, provinces.error]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const focusPoint = (lat: number, lon: number): FlyTarget => ({
    lat, lon, zoom: ANALYSIS.zoom, pitch: ANALYSIS.pitch, focus: true, n: Date.now(),
  });

  /** Clique no globo (só chega aqui dentro de Angola). */
  const pick = (lat: number, lon: number, provinceName?: string) => {
    const province = provinces.data?.refs.find((r) => r.name === provinceName);
    setSel({ kind: 'point', lat, lon, name: nearest(lat, lon).name, province });
    setFly(focusPoint(lat, lon));
  };

  /** Pesquisa: província, capital ou coordenadas. Tudo tem de ficar dentro de Angola. */
  const goPlace = (p: Place) => {
    if (p.kind === 'province') {
      const ref = { name: p.name, lat: p.lat, lon: p.lon };
      setSel({ kind: 'province', lat: p.lat, lon: p.lon, name: p.name, province: ref });
      setFly({ lat: p.lat, lon: p.lon, zoom: 6, focus: true, n: Date.now() });
      return;
    }
    const province = provinces.data ? provinceAt(provinces.data, p.lat, p.lon) : undefined;
    const inside = provinces.data ? province !== undefined : inAngolaBounds(p.lat, p.lon);
    if (p.kind === 'coords' && !inside) {
      setNotice(L(lang, 'Essas coordenadas ficam fora de Angola.', 'Those coordinates are outside Angola.'));
      return;
    }
    setSel({ kind: 'point', lat: p.lat, lon: p.lon, name: nearest(p.lat, p.lon).name, province });
    setFly(focusPoint(p.lat, p.lon));
  };

  const reset = (lat: number, lon: number, zoom: number) => {
    setSel(null);
    setFly({ lat, lon, zoom, n: Date.now() });
  };
  const explore = () => reset(GLOBE.angola.lat, GLOBE.angola.lon, GLOBE.angola.zoom);

  const toggleLayer = (id: IndicatorId) => {
    setInd(id);
    setLayer((cur) => (cur === id ? null : id));
  };

  return (
    <div className={`app${sel ? ' has-sel' : ''}`}>
      <GlobeMap selected={sel} fly={fly} provinces={provinces.data} choropleth={choropleth.colors} onPick={pick} />
      <TopBar tab={tab} setTab={setTab} lang={lang} setLang={setLang} onPlace={goPlace} />
      {tab === 'map' && (
        <>
          <IndicatorRail lang={lang} layer={layer} onToggle={toggleLayer} />
          {layer && (
            <LayerLegend lang={lang} layer={layer} year={year} setYear={setYear} status={choropleth.status}
              onRetry={provinces.retry} onRemove={() => setLayer(null)} />
          )}
          <DataPanel lang={lang} sel={sel} ind={ind} setInd={setInd} year={year} setYear={setYear} mobile={mobile}
            onClose={() => setSel(null)} onOpen={() => setTab('indicators')} />
          {sel && (
            <nav className="crumbs" aria-label="breadcrumb">
              <button onClick={() => reset(GLOBE.center[1], GLOBE.center[0], worldZoom())}>{L(lang, 'Mundo', 'World')}</button> ›
              <button onClick={() => reset(2, 17, 3)}>{L(lang, 'África', 'Africa')}</button> ›
              <button onClick={explore}>Angola</button> ›
              <span>{sel.kind === 'province' ? L(lang, 'Província', 'Province') : L(lang, 'Ponto', 'Point')}</span>
            </nav>
          )}
          {notice && <p className="notice" role="status">{notice}</p>}
          {provinces.status === 'error' && (
            <div className="notice wide">
              <StateBox kind="error" lang={lang} onRetry={provinces.retry}
                text={L(lang, 'Não foi possível carregar as províncias. Corra "npm run data" ou verifique a ligação.', 'Could not load the provinces. Run "npm run data" or check your connection.')} />
            </div>
          )}
          <AiBar lang={lang} onExplore={explore} />
        </>
      )}
      {tab === 'indicators' && (
        <IndicatorsPage lang={lang} ind={ind} setInd={setInd} year={year} setYear={setYear}
          provinces={provinces.data} onPlace={(p) => { setTab('map'); goPlace(p); }} />
      )}
      {tab === 'data' && <DataPage lang={lang} provinces={provinces} />}
    </div>
  );
}

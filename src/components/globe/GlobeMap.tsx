import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GLOBE, MOBILE_BREAKPOINT, basePadding, worldZoom } from '../../config/globe';
import { useGlobeRotation } from '../../hooks/useGlobeRotation';
import type { ProvincesResult } from '../../services/provinces';
import type { Selection } from '../../types/geography';
import { buildStyle } from './mapStyle';
import {
  CLICK_LAYERS,
  addAnalysisLayers,
  addCountryLayers,
  addProvinceLayers,
  setChoropleth,
  setSelectionLayers,
} from './layers';

export interface FlyTarget {
  lat: number;
  lon: number;
  zoom: number;
  /** Muda a cada pedido, para repetir o mesmo destino. */
  n: number;
  pitch?: number;
  /** true ao aproximar de uma localização seleccionada (no telemóvel deixa espaço para o cartão). */
  focus?: boolean;
}

interface Props {
  selected: Selection | null;
  fly: FlyTarget | null;
  provinces: ProvincesResult | null;
  /** Cor por nome de província; null = sem camada de indicador. */
  choropleth: Record<string, string> | null;
  /** Só é chamado para cliques dentro de Angola. */
  onPick: (lat: number, lon: number, provinceName?: string) => void;
}

function markerElement(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'pulse';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = label;
  el.appendChild(tag);
  return el;
}

export function GlobeMap({ selected, fly, provinces, choropleth, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [provReady, setProvReady] = useState(false);

  // Criação do mapa (uma vez).
  useEffect(() => {
    const zoom = worldZoom();
    const m = new maplibregl.Map({
      container: box.current!,
      style: buildStyle(),
      center: GLOBE.center,
      zoom,
      minZoom: Math.max(0.3, zoom - 0.5),
      pitch: GLOBE.pitch,
      bearing: GLOBE.bearing,
      padding: basePadding(),
      attributionControl: { compact: true },
    });

    m.on('load', async () => {
      try {
        m.setSky({
          'sky-color': '#3d8bff', 'horizon-color': '#a8d8ff', 'fog-color': '#0a1830',
          'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.3,
          'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
        });
      } catch {
        /* sem atmosfera */
      }
      addAnalysisLayers(m);
      await addCountryLayers(m);
      setMap(m);
    });

    m.on('click', (e) => {
      const layers = CLICK_LAYERS.filter((id) => m.getLayer(id));
      const f = layers.length ? m.queryRenderedFeatures(e.point, { layers })[0] : undefined;
      if (!f) return; // fora de Angola: ignora o clique
      pick.current(e.lngLat.lat, e.lngLat.lng, (f.properties?.name as string | undefined) ?? undefined);
    });

    m.on('mousemove', (e) => {
      const layers = CLICK_LAYERS.filter((id) => m.getLayer(id));
      const over = layers.length > 0 && m.queryRenderedFeatures(e.point, { layers }).length > 0;
      m.getCanvas().style.cursor = over ? 'pointer' : '';
    });

    return () => m.remove();
  }, []);

  useGlobeRotation(map, selected !== null);

  // Limites das províncias (quando carregados e validados).
  useEffect(() => {
    if (!map || !provinces) return;
    addProvinceLayers(map, provinces);
    setProvReady(true);
  }, [map, provinces]);

  // Camada de indicador (cores por província).
  useEffect(() => {
    if (map && provReady) setChoropleth(map, choropleth);
  }, [map, provReady, choropleth]);

  // Destaque da província e área de análise de 1 km.
  useEffect(() => {
    if (map) setSelectionLayers(map, selected);
  }, [map, provReady, selected]);

  // Marcador da localização seleccionada.
  useEffect(() => {
    marker.current?.remove();
    marker.current = null;
    if (!map || !selected) return;
    const label =
      selected.kind === 'province'
        ? selected.name
        : `Lat ${selected.lat.toFixed(3)} · Lon ${selected.lon.toFixed(3)}`;
    marker.current = new maplibregl.Marker({ element: markerElement(label) }).setLngLat([selected.lon, selected.lat]).addTo(map);
  }, [map, selected]);

  // Voos da câmara (aproximação suave, regresso à vista geral).
  useEffect(() => {
    if (!map || !fly) return;
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const padding = fly.focus && mobile ? { top: 0, left: 0, right: 0, bottom: 290 } : basePadding();
    map.flyTo({
      center: [fly.lon, fly.lat],
      zoom: fly.zoom,
      pitch: fly.pitch ?? 0,
      bearing: fly.zoom < 4 ? GLOBE.bearing : 0,
      padding,
      duration: fly.focus ? 2800 : 1800,
    });
  }, [map, fly]);

  return <div ref={box} className="globe" />;
}

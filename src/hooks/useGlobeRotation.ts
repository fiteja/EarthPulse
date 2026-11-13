import { useEffect } from 'react';
import type { Map } from 'maplibre-gl';
import { GLOBE } from '../config/globe';

/** Roda o globo só quando afastado; pára ao ampliar, ao interagir ou com seleção. */
export function useGlobeRotation(map: Map | null, hasSelection: boolean) {
  useEffect(() => {
    if (!map || hasSelection) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = performance.now();
    let userBusy = false;
    let spinning = map.getZoom() < GLOBE.rotationMaxZoom;
    let timer = 0;

    const busy = () => {
      userBusy = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (userBusy = false), GLOBE.idleResumeMs);
    };
    const events = ['mousedown', 'touchstart', 'wheel'] as const;
    events.forEach((e) => map.on(e, busy));

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      const z = map.getZoom();
      if (z >= GLOBE.rotationMaxZoom) spinning = false;
      else if (z < GLOBE.rotationResumeZoom) spinning = true;
      if (!spinning || userBusy || map.isEasing()) return;
      const c = map.getCenter();
      c.lng += GLOBE.degPerSec * dt;
      map.jumpTo({ center: c });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      events.forEach((e) => map.off(e, busy));
    };
  }, [map, hasSelection]);
}

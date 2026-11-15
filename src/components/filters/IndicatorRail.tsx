import { CloudRain, HeartPulse, Leaf, Thermometer, Users } from 'lucide-react';
import { IDS } from '../../config/indicators';
import { Lang, t } from '../../i18n';
import type { IndicatorId } from '../../types/indicators';

const ICONS = { ndvi: Leaf, temperature: Thermometer, precipitation: CloudRain, population: Users, mortality: HeartPulse };

interface Props {
  lang: Lang;
  /** Indicador que está a colorir o globo (null = globo sem camada). */
  layer: IndicatorId | null;
  onToggle: (id: IndicatorId) => void;
}

/** Barra lateral de camadas: cada botão liga ou desliga o indicador no globo. */
export function IndicatorRail({ lang, layer, onToggle }: Props) {
  return (
    <aside className="rail" aria-label={t(lang, 'layers')}>
      {IDS.map((id) => {
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            className={id === layer ? 'active' : ''}
            aria-pressed={id === layer}
            onClick={() => onToggle(id)}
            title={t(lang, id)}
            aria-label={t(lang, id)}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </aside>
  );
}

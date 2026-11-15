import { dataService } from '../../services/dataService';
import { Lang, t } from '../../i18n';

/** Selo "Demonstrativo": só aparece enquanto os dados vierem do mock. */
export function DemoChip({ lang }: { lang: Lang }) {
  return dataService.isDemo ? <span className="chip">{t(lang, 'demo')}</span> : null;
}

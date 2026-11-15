import { useState } from 'react';
import { Grid2x2, HelpCircle, Sparkles } from 'lucide-react';
import { L, Lang, t } from '../../i18n';

interface Props { lang: Lang; onExplore: () => void }

export function AiBar({ lang, onExplore }: Props) {
  const [msg, setMsg] = useState('');
  return (
    <div className="ai">
      <button className="explore" onClick={onExplore}>{t(lang, 'explore')}</button>
      {msg && <div className="ai-msg" role="status">{msg}</div>}
      <form className="ai-bar" onSubmit={(e) => { e.preventDefault(); setMsg(t(lang, 'aiSoon')); }}>
        <span className="round spark"><Sparkles size={20} /></span>
        <input placeholder={t(lang, 'aiPh')} onChange={() => setMsg('')} />
        <button type="button" className="round" aria-label={L(lang, 'Ajuda', 'Help')} onClick={() => setMsg(L(lang, 'Ex.: "NDVI em Huambo em 2024"', 'E.g. "NDVI in Huambo in 2024"'))}><HelpCircle size={18} /></button>
        <button type="button" className="round" aria-label={t(lang, 'layers')}><Grid2x2 size={18} /></button>
      </form>
    </div>
  );
}

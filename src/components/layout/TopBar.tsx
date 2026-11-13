import { useState } from 'react';
import { Languages, Search, X } from 'lucide-react';
import { L, Lang, t } from '../../i18n';
import { Place, searchPlaces } from '../../services/places';
import type { Tab } from '../../pages/Dashboard';

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  onPlace: (p: Place) => void;
}

const kindLabel = (kind: Place['kind'], lang: Lang) =>
  kind === 'province' ? L(lang, 'Província', 'Province') : kind === 'capital' ? L(lang, 'Capital', 'Capital') : L(lang, 'Coordenadas', 'Coordinates');

export function TopBar({ tab, setTab, lang, setLang, onPlace }: Props) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const results = searchPlaces(q);
  const tabs: Tab[] = ['map', 'indicators', 'data'];
  const closeSearch = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <header className="topbar">
      <div className="logo">Fitaje EarthPulse</div>
      <nav className="nav">
        {tabs.map((id) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {t(lang, id)}
          </button>
        ))}
      </nav>
      <div className="tools">
        {open ? (
          <div className="search">
            <input autoFocus value={q} placeholder={t(lang, 'searchPh')} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && closeSearch()} />
            <button className="icon" aria-label={t(lang, 'close')} onClick={closeSearch}><X size={18} /></button>
            {q && (
              <ul className="results">
                {results.length === 0 && <li className="muted">{t(lang, 'noResults')}</li>}
                {results.map((p) => (
                  <li key={`${p.kind}-${p.name}`}>
                    <button onClick={() => { onPlace(p); closeSearch(); }}>
                      <span>{p.name}</span>
                      <small className="kind">{kindLabel(p.kind, lang)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button className="icon" aria-label="Search" onClick={() => setOpen(true)}><Search size={18} /></button>
        )}
        <div className="lang">
          <button className="icon" aria-label={t(lang, 'language')} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            <Languages size={18} />
          </button>
          {menu && (
            <ul className="menu" role="menu">
              {(['pt', 'en'] as Lang[]).map((l) => (
                <li key={l}>
                  <button role="menuitem" className={l === lang ? 'active' : ''} onClick={() => { setLang(l); setMenu(false); }}>
                    {l === 'pt' ? 'Português' : 'English'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}

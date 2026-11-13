import { AlertTriangle, Info } from 'lucide-react';
import { Lang, t } from '../../i18n';

interface Props {
  kind: 'error' | 'empty';
  lang: Lang;
  text: string;
  onRetry?: () => void;
}

/** Estado de erro ou de "sem dados" (o ícone e o texto não dependem só da cor). */
export function StateBox({ kind, lang, text, onRetry }: Props) {
  const Icon = kind === 'error' ? AlertTriangle : Info;
  return (
    <div className={`state ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span><Icon size={16} /> {text}</span>
      {onRetry && <button onClick={onRetry}>{t(lang, 'retry')}</button>}
    </div>
  );
}

/** Linhas de esqueleto enquanto os dados carregam. */
export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <i key={i} className="sk" style={{ width: `${95 - i * 12}%` }} />)}
    </div>
  );
}

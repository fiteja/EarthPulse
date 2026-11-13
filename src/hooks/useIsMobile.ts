import { useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT } from '../config/globe';

/** true em ecrãs até 767 px (telemóvel). Acompanha rotação e redimensionamento. */
export function useIsMobile(): boolean {
  const query = `(max-width: ${MOBILE_BREAKPOINT}px)`;
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return mobile;
}

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TLink from '../components/TLink';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

/* toast('Added to bag', { to: '/cart', label: 'View bag' }) */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [on, setOn] = useState(false);
  const timer = useRef(0);
  const { pathname } = useLocation();

  // a new page starts without the last page's message
  useEffect(() => { setOn(false); clearTimeout(timer.current); }, [pathname]);

  const show = useCallback((msg, link) => {
    setToast({ msg, link, id: Date.now() });
    requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), 3200);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <div className={'toast' + (on ? ' is-on' : '')} role="status" aria-live="polite">
          <span>{toast.msg}</span>
          {toast.link && <TLink to={toast.link.to}>{toast.link.label}</TLink>}
        </div>
      )}
    </Ctx.Provider>
  );
}

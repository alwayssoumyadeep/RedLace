import { useCallback, useEffect, useRef, useState } from 'react';
import { statusLabel } from '../data/constants';

/* Load something async, with loading / error state and a way to reload or patch it. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const live = useRef(true);
  useEffect(() => () => { live.current = false; }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fn();
      if (live.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (live.current) setState({ data: null, error, loading: false });
    }
  }, deps);
  useEffect(() => { run(); }, [run]);
  const setData = useCallback((d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })), []);
  return { ...state, reload: run, setData };
}

export function AdminHead({ title, note, children }) {
  return (
    <div className="adm-head">
      <div>
        <h1>{title}</h1>
        {note && <p>{note}</p>}
      </div>
      {children && <div className="adm-head__tools">{children}</div>}
    </div>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill pill--${status}`}>{statusLabel(status)}</span>;
}

export function Loading({ text = 'Loading…' }) {
  return <p className="adm-loading" role="status">{text}</p>;
}

export function LoadError({ error, onRetry, explain }) {
  return (
    <div className="form-error adm-error" role="alert">
      <span>{explain ? explain(error) : (error && error.message) || 'Something went wrong.'}</span>
      {onRetry && <button className="link" type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/* Two-step button for things that cannot be undone: first click asks, second click does it. */
export function ConfirmButton({ children, confirm, onConfirm, className = 'btn btn--line btn--sm', busyText = 'Working…' }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function click() {
    if (!asking) {
      setAsking(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setAsking(false), 5000);
      return;
    }
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); setAsking(false); }
  }
  return (
    <button type="button" className={className + (asking ? ' is-asking' : '')} onClick={click} disabled={busy}>
      {busy ? busyText : asking ? confirm : children}
    </button>
  );
}

export const when = (ts) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const day = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

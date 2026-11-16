import { useEffect } from 'react';
import TLink from './TLink';
import { rupee } from '../lib/catalog';

/* Small shared pieces: empty states, form fields, price summary, drag-to-scroll. */

export function EmptyState({ title, text, to, action }) {
  return (
    <div className="empty">
      <h2 className="d h-md">{title}</h2>
      <p>{text}</p>
      <TLink className="btn btn--ink" to={to}>{action}</TLink>
    </div>
  );
}

export function PageHead({ title, note }) {
  return (
    <div className="page-head">
      <h1 className="d h-xl">{title}</h1>
      {note && <p>{note}</p>}
    </div>
  );
}

/* <Field name="email" label="Email" error="…" bad={…} value onChange … /> */
export function Field({ name, label, error, bad, children, as, ...input }) {
  return (
    <label className={'field' + (bad ? ' is-bad' : '')} data-f={error ? name : undefined}>
      <span>{label}</span>
      {as === 'select' ? <select name={name} {...input}>{children}</select>
        : as === 'textarea' ? <textarea name={name} {...input} />
          : <input name={name} {...input} />}
      {error && <small>{error}</small>}
    </label>
  );
}

export function SummaryRows({ totals, extra = 0 }) {
  const delivery = totals.delivery + extra;
  return (
    <dl>
      <div><dt>Subtotal</dt><dd>{rupee(totals.subtotal)}</dd></div>
      {totals.discount > 0 && <div className="sum__save"><dt>Code {totals.promo}</dt><dd>−{rupee(totals.discount)}</dd></div>}
      <div><dt>Delivery</dt><dd>{delivery ? rupee(delivery) : 'Free'}</dd></div>
      <div className="sum__total"><dt>Total</dt><dd>{rupee(totals.total + extra)}</dd></div>
    </dl>
  );
}

/* Focus and centre the first invalid field in a form. */
export function focusFirstBad(form) {
  const field = form && form.querySelector('.field.is-bad');
  if (!field) return;
  const control = field.querySelector('input, select, textarea');
  if (control) control.focus({ preventScroll: true });
  field.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* Click-and-drag sideways scrolling for a rail, without breaking clicks on its links. */
export function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let down = false, startX = 0, startLeft = 0, moved = false;
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft;
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; el.classList.add('is-drag'); }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      setTimeout(() => el.classList.remove('is-drag'), 0);
    };
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    const onDrag = (e) => e.preventDefault();
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', onDrag);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', onDrag);
    };
  }, [ref]);
}

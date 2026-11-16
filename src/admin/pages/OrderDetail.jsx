import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdminHead, ConfirmButton, Loading, LoadError, StatusPill, useLoad, when } from '../shared';
import { admin, explain } from '../../lib/api';
import { rupee } from '../../lib/catalog';
import { STATUSES, statusIndex } from '../../data/constants';
import { useToast } from '../../context/ToastContext';
import { useCatalog } from '../../context/CatalogContext';
import { useTitle } from '../../context/PageTransition';

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { reload: reloadCatalog } = useCatalog();
  const { data: o, error, loading, reload } = useLoad(() => admin.order(id), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  useTitle(`${o ? o.number : 'Order'} — Redlace admin`);

  if (loading && !o) return <><Back /><Loading /></>;
  if (error) return <><Back /><LoadError error={error} onRetry={reload} explain={explain} /></>;
  if (!o) return <><Back /><p className="adm-empty">This order does not exist. It may have been removed.</p></>;

  const cancelled = o.status === 'cancelled';
  const step = statusIndex(o.status);
  const next = !cancelled && step < STATUSES.length - 1 ? STATUSES[step + 1] : null;

  async function move(status) {
    setBusy(true);
    setActionError('');
    try {
      await admin.setOrderStatus(o.id, status);
      await reload();
      if (status === 'cancelled') reloadCatalog();
      toast(status === 'cancelled' ? `${o.number} cancelled and its pairs are back in stock` : `${o.number} marked as ${STATUSES[statusIndex(status)].label.toLowerCase()}`);
    } catch (err) {
      setActionError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  const pairs = o.order_items.reduce((n, i) => n + i.qty, 0);
  return (
    <>
      <Back />
      <AdminHead title={o.number} note={`Placed ${when(o.created_at)}, ${pairs} ${pairs === 1 ? 'pair' : 'pairs'}`}>
        <StatusPill status={o.status} />
      </AdminHead>

      {!cancelled && (
        <section className="adm-card adm-steps" aria-label="Order progress">
          <ol className="adm-track">
            {STATUSES.map((s, i) => (
              <li key={s.key} className={i <= step ? 'is-done' : undefined} aria-current={i === step ? 'step' : undefined}>{s.label}</li>
            ))}
          </ol>
          <div className="adm-steps__actions">
            {next && <button className="btn btn--red btn--sm" type="button" disabled={busy} onClick={() => move(next.key)}>{busy ? 'Saving…' : next.action}</button>}
            <label className="select">
              <span className="sr">Set status</span>
              <select value={o.status} disabled={busy} onChange={(e) => move(e.target.value)}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <ConfirmButton confirm="Yes, cancel and restock" onConfirm={() => move('cancelled')}>Cancel order</ConfirmButton>
          </div>
          {actionError && <p className="form-error" role="alert">{actionError}</p>}
        </section>
      )}
      {cancelled && <p className="adm-note">This order is cancelled. Its pairs went back into stock when it was cancelled.</p>}

      <div className="adm-grid">
        <section className="adm-card adm-grid__wide" aria-labelledby="itemsH">
          <header><h2 id="itemsH">Pairs</h2></header>
          <ul className="adm-items">
            {o.order_items.map((it) => (
              <li key={it.id}>
                <span className="thumb"><img src={it.image} alt="" /></span>
                <span>
                  {it.product_id ? <Link className="adm-strong" to={`/admin/products/${it.product_id}`}>{it.brand} {it.name}</Link> : <b>{it.brand} {it.name}</b>}
                  <small className="adm-sub">{it.colorway}, UK {it.size}, {it.qty} × {rupee(it.price)}</small>
                </span>
                <b className="num">{rupee(it.price * it.qty)}</b>
              </li>
            ))}
          </ul>
          <dl className="adm-sum">
            <div><dt>Subtotal</dt><dd>{rupee(o.subtotal)}</dd></div>
            {o.discount > 0 && <div><dt>Code {o.promo_code}</dt><dd>−{rupee(o.discount)}</dd></div>}
            <div><dt>{o.speed === 'express' ? 'Express delivery' : 'Standard delivery'}</dt><dd>{o.delivery ? rupee(o.delivery) : 'Free'}</dd></div>
            <div className="adm-sum__total"><dt>Total</dt><dd>{rupee(o.total)}</dd></div>
          </dl>
        </section>

        <section className="adm-card" aria-labelledby="custH">
          <header><h2 id="custH">Customer</h2></header>
          <dl className="adm-facts">
            <div><dt>Name</dt><dd>{o.name}</dd></div>
            <div><dt>Email</dt><dd><a className="link" href={`mailto:${o.email}?subject=${encodeURIComponent(`Your Redlace order ${o.number}`)}`}>{o.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a className="link" href={`tel:+91${o.phone}`}>+91 {o.phone}</a></dd></div>
            <div><dt>Account</dt><dd>{o.user_id ? 'Signed in' : 'Guest checkout'}</dd></div>
          </dl>
        </section>

        <section className="adm-card" aria-labelledby="shipH">
          <header><h2 id="shipH">Delivery</h2></header>
          <dl className="adm-facts">
            <div><dt>Address</dt><dd>{o.address}<br />{o.city} {o.pin}</dd></div>
            <div><dt>Speed</dt><dd>{o.speed === 'express' ? 'Express, next day' : 'Standard, 2 to 4 days'}</dd></div>
            <div><dt>Due by</dt><dd>{when(o.eta)}</dd></div>
            <div><dt>Payment</dt><dd>{o.pay_method} <small className="adm-sub">Demo checkout, nothing charged</small></dd></div>
          </dl>
        </section>
      </div>
    </>
  );
}

function Back() {
  return <Link className="adm-back" to="/admin/orders">← All orders</Link>;
}

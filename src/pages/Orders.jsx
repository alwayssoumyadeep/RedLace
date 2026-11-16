import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TLink from '../components/TLink';
import { EmptyState, PageHead } from '../components/ui';
import { STATUSES, statusIndex } from '../data/constants';
import { label, rupee, stockOf } from '../lib/catalog';
import { explain, getOrders } from '../lib/api';
import { formatDate } from '../lib/util';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { usePageReady, useTitle } from '../context/PageTransition';

const PAY_LABEL = { UPI: 'UPI', Card: 'Card', 'Net banking': 'Net banking', 'Cash on delivery': 'Cash on delivery' };

export default function Orders() {
  useTitle('Your orders — Redlace');
  const { guestOrders, add } = useStore();
  const { user, loading: authLoading } = useAuth();
  const { byId } = useCatalog();
  const toast = useToast();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [grow, setGrow] = useState(false);
  usePageReady(null, orders !== null || !!error);

  const uid = user ? user.id : null;
  useEffect(() => {
    if (authLoading) return undefined;
    let live = true;
    getOrders(guestOrders)
      .then((list) => { if (live) { setOrders(list); setError(''); } })
      .catch((err) => { if (live) setError(explain(err)); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, authLoading]);

  // let the progress lines draw in once the page is on screen
  useEffect(() => {
    if (!orders) return undefined;
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setGrow(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [orders]);

  const list = orders || [];
  const just = list.find((o) => o.number === params.get('placed'));

  function buyAgain(o) {
    let added = 0;
    o.items.forEach((it) => {
      const p = it.product_id && byId(it.product_id);
      const left = p ? stockOf(p, it.size) : 0;
      if (left > 0) { add(p.id, it.size, Math.min(it.qty, left), left); added++; }
    });
    toast(added ? 'Added to bag' : 'Those pairs are sold out in your sizes', added ? { to: '/cart', label: 'View bag' } : null);
  }

  return (
    <div className="wrap" id="orders">
      <PageHead title="Your orders" note={list.length ? `${list.length} ${list.length === 1 ? 'order' : 'orders'}` : ''} />
      {just && (
        <div className="placed" role="status">
          <div>
            <h2 className="d">Order placed</h2>
            <p>{just.number} is confirmed. It should reach you by {formatDate(just.eta)}.</p>
          </div>
          <TLink className="btn btn--white" to="/shop">Keep shopping</TLink>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {orders && !list.length && (
        <EmptyState
          title="No orders yet"
          text={user ? 'When you buy a pair, you can follow it here from our shelf to your door.' : 'Orders you place in this browser show up here. Sign in to see orders on your account.'}
          to={user ? '/shop' : '/login?next=/orders'}
          action={user ? 'Find a pair' : 'Sign in'}
        />
      )}
      {list.map((o) => {
        const cancelled = o.status === 'cancelled';
        const step = statusIndex(o.status);
        const done = o.status === 'delivered';
        const total = o.items.reduce((n, it) => n + it.qty, 0);
        return (
          <article className="order" key={o.id}>
            <div className="order__head">
              <h2 className="order__id">{o.number}</h2>
              <p className="order__meta">
                <span>Placed <b>{formatDate(o.created_at)}</b></span>
                {!cancelled && <span>{done ? 'Delivered' : 'Arriving by'} <b>{formatDate(o.eta)}</b></span>}
                <span>Paid by <b>{PAY_LABEL[o.pay_method] || o.pay_method}</b></span>
                <span>Total <b>{rupee(o.total)}</b></span>
              </p>
            </div>
            {cancelled ? (
              <p className="order__cancelled">This order was cancelled. Any payment is refunded to the original method within 5 working days.</p>
            ) : (
              <ol className="track" style={{ '--p': grow ? step / 4 : 0 }} aria-label={`Delivery progress: ${STATUSES[step].label}`}>
                {STATUSES.map((s, i) => (
                  <li key={s.key} className={i <= step ? 'is-done' : undefined} aria-current={i === step ? 'step' : undefined}>{s.label}</li>
                ))}
              </ol>
            )}
            <div className="order__items">
              {o.items.map((it, i) => {
                const p = it.product_id && byId(it.product_id);
                const body = (
                  <>
                    <span className="line__img"><img src={it.image} alt={`${it.name} ${it.colorway}`} loading="lazy" /></span>
                    <span><b>{p ? label(p) : `${it.brand} ${it.name}`}</b><small>{it.colorway}, UK {it.size}, qty {it.qty}</small></span>
                  </>
                );
                return p
                  ? <TLink className="order__item" key={i} to={`/product/${p.id}`}>{body}</TLink>
                  : <div className="order__item" key={i}>{body}</div>;
              })}
            </div>
            <div className="order__foot">
              <button className="btn btn--ink" type="button" onClick={() => buyAgain(o)}>Buy again</button>
              <TLink className="btn btn--line" to={`/contact?order=${encodeURIComponent(o.number)}`}>Get help with this order</TLink>
              <span className="order__count">{total} {total === 1 ? 'pair' : 'pairs'}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

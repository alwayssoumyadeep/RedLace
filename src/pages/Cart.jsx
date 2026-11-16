import { useState } from 'react';
import TLink from '../components/TLink';
import { EmptyState, PageHead, SummaryRows } from '../components/ui';
import { MinusIcon, PlusIcon } from '../components/Icons';
import { FREE_DELIVERY_FROM, MAX_PER_LINE } from '../data/constants';
import { fullName, img, label, rupee, stockOf } from '../lib/catalog';
import { checkPromo, explain } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useCatalog } from '../context/CatalogContext';
import { usePageReady, useTitle } from '../context/PageTransition';

export default function Cart() {
  usePageReady();
  useTitle('Your bag — Redlace');
  const { byId } = useCatalog();
  const { cart, count, totals, setQty, removeLine, promo, setPromo } = useStore();
  const toast = useToast();
  const [code, setCode] = useState(promo ? promo.code : '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const lines = cart.map((l, i) => ({ ...l, i, p: byId(l.id) })).filter((l) => l.p);

  if (!lines.length) {
    return (
      <div className="wrap" id="cart">
        <PageHead title="Your bag" />
        <EmptyState title="Nothing in here yet" text="Pick a pair and a size, and it will wait for you here." to="/shop" action="Find a pair" />
      </div>
    );
  }

  async function applyCode(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) { setPromo(null); setMsg('Code removed.'); setCode(''); return; }
    setBusy(true);
    try {
      const percent = await checkPromo(c);
      if (percent) { setPromo({ code: c, percent }); setMsg(`${percent}% off applied.`); setCode(c); }
      else { setMsg(`“${c}” is not a code we recognise. Check the spelling.`); setCode(promo ? promo.code : ''); }
    } catch (err) {
      setMsg(explain(err));
    } finally {
      setBusy(false);
    }
  }
  function changeQty(i, qty) { setQty(i, qty); setMsg(''); }
  function remove(l) {
    removeLine(l.i); setMsg('');
    toast(`Removed ${l.p.name} from your bag`);
  }

  const short = lines.filter((l) => l.qty > stockOf(l.p, l.size));
  const toFree = FREE_DELIVERY_FROM - (totals.subtotal - totals.discount);
  return (
    <div className="wrap" id="cart">
      <PageHead title="Your bag" note={`${count} ${count === 1 ? 'pair' : 'pairs'}`} />
      <div className="two">
        <div>
          {lines.map((l) => {
            const left = stockOf(l.p, l.size);
            return (
              <div className="line" key={`${l.id}-${l.size}`}>
                <TLink className="line__img" to={`/product/${l.p.id}`}><img src={img(l.p)} alt={fullName(l.p)} /></TLink>
                <div>
                  <TLink className="line__name" to={`/product/${l.p.id}`}>{label(l.p)}</TLink>
                  <p className="line__meta">{l.p.colorway}, UK {l.size}</p>
                  {l.qty > left && (
                    <p className="line__warn" role="alert">
                      {left === 0 ? 'This size just sold out. Remove it to check out.' : `Only ${left} left in this size. Lower the quantity to check out.`}
                    </p>
                  )}
                  <div className="line__tools">
                    <div className="qty">
                      <button type="button" aria-label="One fewer" onClick={() => changeQty(l.i, l.qty - 1)}><MinusIcon /></button>
                      <output aria-label="Quantity">{l.qty}</output>
                      <button type="button" aria-label="One more" disabled={l.qty >= Math.min(MAX_PER_LINE, left)} onClick={() => changeQty(l.i, l.qty + 1)}><PlusIcon /></button>
                    </div>
                    <button className="line__rm" type="button" onClick={() => remove(l)}>Remove</button>
                  </div>
                </div>
                <p className="line__price">{rupee(l.p.price * l.qty)}</p>
              </div>
            );
          })}
        </div>
        <aside className="sum" aria-label="Order summary">
          <h2>Summary</h2>
          <SummaryRows totals={totals} />
          <form className="promo" onSubmit={applyCode}>
            <label className="sr" htmlFor="code">Promo code</label>
            <input id="code" placeholder="Promo code" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn btn--line" type="submit" disabled={busy}>{busy ? 'Checking…' : 'Apply'}</button>
          </form>
          <p className="promo__msg" role="status">{msg || (promo ? `${promo.percent}% off applied.` : 'First order? Try LACEUP10.')}</p>
          {short.length > 0
            ? <button className="btn btn--red btn--block" type="button" disabled>Go to checkout</button>
            : <TLink className="btn btn--red btn--block" to="/checkout">Go to checkout</TLink>}
          <p className="sum__note">{totals.delivery ? `Add ${rupee(toFree)} more for free delivery.` : 'Free delivery on this order.'}</p>
        </aside>
      </div>
    </div>
  );
}

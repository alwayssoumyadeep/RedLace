import { useRef, useState } from 'react';
import { EmptyState, Field, PageHead, SummaryRows, focusFirstBad } from '../components/ui';
import { EXPRESS_DELIVERY, PAYMENTS } from '../data/constants';
import { img, label, rupee } from '../lib/catalog';
import { explain, placeOrder } from '../lib/api';
import { isEmail } from '../lib/util';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { usePageReady, usePageTransition, useTitle } from '../context/PageTransition';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'];

/* Keep only what each field may contain, and add the separators people expect. */
const FORMAT = {
  phone: (v) => v.replace(/\D/g, ''),
  pin: (v) => v.replace(/\D/g, ''),
  cvv: (v) => v.replace(/\D/g, ''),
  card: (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 '),
  exp: (v) => v.replace(/[^\d]/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
};

export default function Checkout() {
  usePageReady();
  useTitle('Checkout — Redlace');
  const { products, byId, reload } = useCatalog();
  const { cart, totals, promo, clearCart, setPromo, rememberOrder } = useStore();
  const { user } = useAuth();
  const { go } = usePageTransition();
  const formRef = useRef(null);
  const [v, setV] = useState({
    name: (user && user.name) || '', email: (user && user.email) || '', phone: (user && user.phone) || '',
    address: '', city: '', pin: '', upi: '', card: '', exp: '', cvv: '', bank: '',
  });
  const [speed, setSpeed] = useState('standard');
  const [pay, setPay] = useState('UPI');
  const [bad, setBad] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null); // freeze the page while the curtain drops

  const live = cart.filter((l) => byId(l.id));
  const lines = placed ? placed.lines : live;
  const shown = placed ? placed.totals : totals;

  if (!lines.length) {
    return (
      <div className="wrap" id="checkout">
        <PageHead title="Checkout" />
        <EmptyState title="Your bag is empty" text="Add a pair to your bag before checking out." to="/shop" action="Find a pair" />
      </div>
    );
  }

  const extra = speed === 'express' ? EXPRESS_DELIVERY - shown.delivery : 0;
  const set = (name) => (e) => {
    const raw = e.target.value;
    setV((s) => ({ ...s, [name]: FORMAT[name] ? FORMAT[name](raw) : raw }));
    setBad((b) => ({ ...b, [name]: false }));
  };
  const field = (name, lbl, err, props = {}) => (
    <Field name={name} label={lbl} error={err} bad={bad[name]} value={v[name]} onChange={set(name)} {...props} />
  );

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const t = (n) => v[n].trim();
    const checks = {
      name: t('name').length > 1,
      email: isEmail(t('email')),
      phone: /^\d{10}$/.test(t('phone')),
      address: t('address').length > 5,
      city: t('city').length > 1,
      pin: /^\d{6}$/.test(t('pin')),
    };
    // payment details are only checked for shape; they are never sent anywhere
    if (pay === 'UPI') checks.upi = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(t('upi'));
    if (pay === 'Card') {
      checks.card = t('card').replace(/\s/g, '').length === 16;
      checks.exp = /^(0[1-9]|1[0-2])\/\d{2}$/.test(t('exp'));
      checks.cvv = /^\d{3,4}$/.test(t('cvv'));
    }
    if (pay === 'Net banking') checks.bank = !!t('bank');
    const nextBad = Object.fromEntries(Object.entries(checks).map(([k, ok]) => [k, !ok]));
    setBad(nextBad);
    if (Object.values(nextBad).some(Boolean)) {
      requestAnimationFrame(() => focusFirstBad(formRef.current));
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await placeOrder({
        items: live.map((l) => ({ id: l.id, size: l.size, qty: l.qty })),
        name: t('name'), email: t('email'), phone: t('phone'), address: t('address'), city: t('city'), pin: t('pin'),
        speed, pay, promo: promo ? promo.code : null,
      });
      setPlaced({ lines: live, totals });
      rememberOrder(res.order_id);
      clearCart();
      setPromo(null);
      reload(); // stock just changed
      go(`/orders?placed=${res.order_number}`);
    } catch (err) {
      setError(explain(err, products));
      if (/INVALID_PROMO/.test(err.message || '')) setPromo(null);
      setBusy(false);
    }
  }

  return (
    <div className="wrap" id="checkout">
      <PageHead title="Checkout" />
      <p className="demo-note">Payment is a demo: placing an order saves it for real, but charges nothing. Card and UPI details stay in your browser and are never sent anywhere.</p>
      <div className="two">
        <form id="co" className="form" noValidate ref={formRef} onSubmit={submit}>
          <fieldset className="step">
            <legend><span className="step__n">1</span>Where should we send it?</legend>
            <div className="form">
              {field('name', 'Full name', 'Enter the name for the delivery label.', { autoComplete: 'name' })}
              <div className="form__row">
                {field('email', 'Email', 'Enter an email like you@example.com. Order updates go here.', { type: 'email', autoComplete: 'email' })}
                {field('phone', 'Mobile number', 'Enter a 10-digit mobile number.', { type: 'tel', inputMode: 'numeric', autoComplete: 'tel', maxLength: 10 })}
              </div>
              {field('address', 'Flat, building and street', 'Enter the address the courier should come to.', { autoComplete: 'street-address' })}
              <div className="form__row">
                {field('city', 'City', 'Enter your city.', { autoComplete: 'address-level2' })}
                {field('pin', 'PIN code', 'Enter a 6-digit PIN code.', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 })}
              </div>
            </div>
          </fieldset>

          <fieldset className="step">
            <legend><span className="step__n">2</span>How fast?</legend>
            <div className="opts">
              <label className="opt">
                <input type="radio" name="speed" value="standard" checked={speed === 'standard'} onChange={() => setSpeed('standard')} />
                <span><b>Standard</b><small>Arrives in 2 to 4 days</small></span>
                <span className="opt__end">{shown.delivery ? rupee(shown.delivery) : 'Free'}</span>
              </label>
              <label className="opt">
                <input type="radio" name="speed" value="express" checked={speed === 'express'} onChange={() => setSpeed('express')} />
                <span><b>Express</b><small>Arrives tomorrow in metro cities</small></span>
                <span className="opt__end">{rupee(EXPRESS_DELIVERY)}</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="step">
            <legend><span className="step__n">3</span>How will you pay?</legend>
            <div className="opts">
              {PAYMENTS.map(([value, title, note]) => (
                <label className="opt" key={value}>
                  <input type="radio" name="pay" value={value} checked={pay === value} onChange={() => setPay(value)} />
                  <span><b>{title}</b><small>{note}</small></span>
                </label>
              ))}
            </div>
            <div className="pay-extra form" hidden={pay !== 'UPI'}>
              {field('upi', 'UPI ID', 'Enter a UPI ID like name@bank.', { placeholder: 'name@bank', autoComplete: 'off' })}
            </div>
            <div className="pay-extra form" hidden={pay !== 'Card'}>
              {field('card', 'Card number', 'Enter the 16-digit card number.', { inputMode: 'numeric', autoComplete: 'off', maxLength: 19, placeholder: '0000 0000 0000 0000' })}
              <div className="form__row">
                {field('exp', 'Expiry', 'Enter the expiry as MM/YY.', { placeholder: 'MM/YY', maxLength: 5, autoComplete: 'off' })}
                {field('cvv', 'CVV', 'Enter the 3 or 4 digits on the back.', { type: 'password', inputMode: 'numeric', maxLength: 4, autoComplete: 'off' })}
              </div>
            </div>
            <div className="pay-extra form" hidden={pay !== 'Net banking'}>
              {field('bank', 'Your bank', 'Choose your bank.', {
                as: 'select',
                children: [<option key="" value="">Choose a bank</option>, ...BANKS.map((b) => <option key={b}>{b}</option>)],
              })}
            </div>
          </fieldset>
        </form>

        <aside className="sum" aria-label="Order summary">
          <h2>Your order</h2>
          <div className="mini">
            {lines.map((l) => {
              const p = byId(l.id);
              return (
                <div className="mini__row" key={`${l.id}-${l.size}`}>
                  <span className="mini__img"><img src={img(p)} alt="" /></span>
                  <span><b>{label(p)}</b><small>UK {l.size}, qty {l.qty}</small></span>
                  <span>{rupee(p.price * l.qty)}</span>
                </div>
              );
            })}
          </div>
          <SummaryRows totals={shown} extra={extra} />
          {error && <p className="form-error" role="alert" style={{ marginTop: 16, marginBottom: 0 }}>{error}</p>}
          <button className="btn btn--red btn--block" type="submit" form="co" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
          <p className="sum__note">You can cancel free of charge until it ships.</p>
        </aside>
      </div>
    </div>
  );
}

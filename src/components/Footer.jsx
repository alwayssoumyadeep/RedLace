import { useState } from 'react';
import TLink from './TLink';
import { isEmail } from '../lib/util';
import { explain, subscribe } from '../lib/api';

const COLUMNS = [
  { title: 'Shop', links: [['/shop', 'All sneakers'], ['/shop?sort=new', 'New drops'], ['/shop?type=Low-top', 'Low-tops'], ['/shop?type=High-top', 'High-tops'], ['/shop?type=Runner', 'Runners']] },
  { title: 'Help', links: [['/orders', 'Track an order'], ['/contact#faq', 'Delivery and returns'], ['/contact#faq', 'Size guide'], ['/contact', 'Contact us']] },
  { title: 'Account', links: [['/login', 'Sign in'], ['/wishlist', 'Wishlist'], ['/cart', 'Bag']] },
];

function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('One email a week. Unsubscribe whenever you like.');

  async function submit(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!isEmail(email)) {
      setNote('That email looks incomplete. Check it and sign up again.');
      input.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await subscribe(email);
      setNote(result === 'already' ? 'You are already on the list. The next drop email goes out on Friday.' : 'Signed up. The next drop email goes out on Friday.');
      setEmail('');
    } catch (err) {
      setNote(explain(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="foot__news">
      <h2 className="foot__h">Hear about drops a day early</h2>
      <form className="foot__form" onSubmit={submit} noValidate>
        <label className="sr" htmlFor="newsEmail">Email address</label>
        <input id="newsEmail" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn--white" type="submit" disabled={busy}>{busy ? 'Signing up…' : 'Sign me up'}</button>
      </form>
      <p className="foot__note" role="status">{note}</p>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__top">
        <Newsletter />
        <div className="foot__cols">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              {col.links.map(([to, text]) => <TLink key={text} to={to}>{text}</TLink>)}
            </div>
          ))}
        </div>
      </div>
      <div className="foot__word" aria-hidden="true">REDLACE</div>
      <div className="wrap foot__base">
        <span>© 2026 Redlace Sneakers. Design prototype.</span>
        <span>Every pair checked by hand in Bengaluru.</span>
      </div>
    </footer>
  );
}

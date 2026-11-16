import { Link } from 'react-router-dom';
import { AdminHead, Loading, LoadError, StatusPill, useLoad, when } from '../shared';
import { admin, explain } from '../../lib/api';
import { label, rupee } from '../../lib/catalog';
import { SIZES } from '../../data/constants';
import { useTitle } from '../../context/PageTransition';

const DAY = 86400000;
const OPEN = ['placed', 'packed', 'shipped', 'out_for_delivery'];

function periodStats(orders, from, to) {
  const inRange = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= from && t < to && o.status !== 'cancelled';
  });
  const revenue = inRange.reduce((n, o) => n + o.total, 0);
  return { revenue, count: inRange.length, avg: inRange.length ? revenue / inRange.length : 0 };
}

/* "+12% vs the 30 days before"; up is good for every figure on this page. */
function Delta({ now, before }) {
  if (!before) return <p className="stat__delta">Nothing in the 30 days before</p>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <p className="stat__delta">Same as the 30 days before</p>;
  return (
    <p className={`stat__delta ${pct > 0 ? 'is-up' : 'is-down'}`}>
      <span aria-hidden="true">{pct > 0 ? '▲' : '▼'}</span> {pct > 0 ? '+' : '−'}{Math.abs(pct)}% vs the 30 days before
    </p>
  );
}

function Stat({ label, value, children }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {children}
    </div>
  );
}

export default function Dashboard() {
  useTitle('Dashboard — Redlace admin');
  const { data, error, loading, reload } = useLoad(() => Promise.all([admin.orders(), admin.products(), admin.messages()]));

  if (loading && !data) return <><AdminHead title="Dashboard" /><Loading /></>;
  if (error) return <><AdminHead title="Dashboard" /><LoadError error={error} onRetry={reload} explain={explain} /></>;

  const [orders, products, messages] = data;
  const now = Date.now();
  const cur = periodStats(orders, now - 30 * DAY, now + 1);
  const prev = periodStats(orders, now - 60 * DAY, now - 30 * DAY);
  const open = orders.filter((o) => OPEN.includes(o.status));
  const toPack = open.filter((o) => o.status === 'placed').length;
  const low = products
    .filter((p) => p.active)
    .flatMap((p) => SIZES.map((s) => ({ p, size: s, left: p.stock[s] || 0 })))
    .filter((r) => r.left <= 2)
    .sort((a, b) => a.left - b.left)
    .slice(0, 8);
  const fresh = messages.filter((m) => m.status === 'new');

  return (
    <>
      <AdminHead title="Dashboard" note="The last 30 days, excluding cancelled orders.">
        <button className="btn btn--line btn--sm" type="button" onClick={reload}>Refresh</button>
      </AdminHead>

      <section className="stats" aria-label="Last 30 days">
        <Stat label="Revenue" value={rupee(cur.revenue)}><Delta now={cur.revenue} before={prev.revenue} /></Stat>
        <Stat label="Orders" value={cur.count.toLocaleString('en-IN')}><Delta now={cur.count} before={prev.count} /></Stat>
        <Stat label="Average order" value={rupee(cur.avg)}><Delta now={cur.avg} before={prev.avg} /></Stat>
        <Stat label="Open orders" value={open.length.toLocaleString('en-IN')}>
          <p className="stat__delta">{toPack ? `${toPack} waiting to be packed` : 'Nothing waiting to be packed'}</p>
        </Stat>
      </section>

      <div className="adm-grid">
        <section className="adm-card adm-grid__wide" aria-labelledby="recentH">
          <header><h2 id="recentH">Latest orders</h2><Link className="link" to="/admin/orders">All orders</Link></header>
          {orders.length ? (
            <div className="adm-scroll">
              <table className="adm-table">
                <thead><tr><th>Order</th><th>Placed</th><th>Customer</th><th className="num">Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td><Link className="adm-strong" to={`/admin/orders/${o.id}`}>{o.number}</Link></td>
                      <td>{when(o.created_at)}</td>
                      <td>{o.name}</td>
                      <td className="num">{rupee(o.total)}</td>
                      <td><StatusPill status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-empty">No orders yet. They show up here the moment someone checks out.</p>}
        </section>

        <section className="adm-card" aria-labelledby="lowH">
          <header><h2 id="lowH">Running low</h2><Link className="link" to="/admin/products">Products</Link></header>
          {low.length ? (
            <ul className="adm-list">
              {low.map((r) => (
                <li key={`${r.p.id}-${r.size}`}>
                  <Link to={`/admin/products/${r.p.id}`}>{label(r.p)} <small>{r.p.colorway}, UK {r.size}</small></Link>
                  <b className={r.left === 0 ? 'is-out' : undefined}>{r.left === 0 ? 'Sold out' : `${r.left} left`}</b>
                </li>
              ))}
            </ul>
          ) : <p className="adm-empty">Every size has at least 3 pairs.</p>}
        </section>

        <section className="adm-card" aria-labelledby="msgH">
          <header><h2 id="msgH">New messages</h2><Link className="link" to="/admin/messages">All messages</Link></header>
          {fresh.length ? (
            <ul className="adm-list">
              {fresh.slice(0, 4).map((m) => (
                <li key={m.id}>
                  <Link to="/admin/messages">{m.name} <small>{m.topic}</small></Link>
                  <span className="adm-muted">{when(m.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="adm-empty">No new messages. You are all caught up.</p>}
        </section>
      </div>
    </>
  );
}

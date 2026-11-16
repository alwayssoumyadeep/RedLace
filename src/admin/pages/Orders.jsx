import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminHead, Loading, LoadError, StatusPill, useLoad, when } from '../shared';
import { admin, explain } from '../../lib/api';
import { rupee } from '../../lib/catalog';
import { STATUSES } from '../../data/constants';
import { useTitle } from '../../context/PageTransition';

const FILTERS = [{ key: 'all', label: 'All' }, ...STATUSES.map((s) => ({ key: s.key, label: s.label })), { key: 'cancelled', label: 'Cancelled' }];

export default function Orders() {
  useTitle('Orders — Redlace admin');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const q = params.get('q') || '';
  const { data, error, loading, reload } = useLoad(() => admin.orders());

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && v !== 'all') next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const orders = data || [];
  const needle = q.trim().toLowerCase();
  const list = orders.filter((o) => (status === 'all' || o.status === status)
    && (!needle || `${o.number} ${o.name} ${o.email} ${o.phone} ${o.city}`.toLowerCase().includes(needle)));
  const count = (k) => (k === 'all' ? orders.length : orders.filter((o) => o.status === k).length);

  return (
    <>
      <AdminHead title="Orders" note={data ? `${orders.length} in total` : ''}>
        <button className="btn btn--line btn--sm" type="button" onClick={reload}>Refresh</button>
      </AdminHead>

      <div className="adm-filters">
        <div className="chips" role="group" aria-label="Status">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="chip" aria-pressed={status === f.key} onClick={() => setParam('status', f.key)}>
              {f.label} <span className="chip__n">{count(f.key)}</span>
            </button>
          ))}
        </div>
        <label className="adm-search">
          <span className="sr">Search orders</span>
          <input type="search" placeholder="Order number, name, email or phone" value={q} onChange={(e) => setParam('q', e.target.value)} />
        </label>
      </div>

      {loading && !data ? <Loading /> : error ? <LoadError error={error} onRetry={reload} explain={explain} /> : (
        <section className="adm-card">
          {list.length ? (
            <div className="adm-scroll">
              <table className="adm-table adm-table--rows">
                <thead>
                  <tr><th>Order</th><th>Placed</th><th>Customer</th><th className="num">Pairs</th><th className="num">Total</th><th>Payment</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id} onClick={(e) => { if (!e.target.closest('a')) navigate(`/admin/orders/${o.id}`); }}>
                      <td><Link className="adm-strong" to={`/admin/orders/${o.id}`}>{o.number}</Link></td>
                      <td>{when(o.created_at)}</td>
                      <td>{o.name}<small className="adm-sub">{o.email}</small></td>
                      <td className="num">{o.order_items.reduce((n, i) => n + i.qty, 0)}</td>
                      <td className="num">{rupee(o.total)}</td>
                      <td>{o.pay_method}</td>
                      <td><StatusPill status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="adm-empty">
              {orders.length ? 'No orders match. Clear the search or pick another status.' : 'No orders yet. They show up here the moment someone checks out.'}
            </p>
          )}
        </section>
      )}
    </>
  );
}

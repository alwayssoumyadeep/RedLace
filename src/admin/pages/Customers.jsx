import { useState } from 'react';
import { AdminHead, ConfirmButton, Loading, LoadError, day, useLoad } from '../shared';
import { admin, explain } from '../../lib/api';
import { rupee } from '../../lib/catalog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTitle } from '../../context/PageTransition';

export default function Customers() {
  useTitle('Customers — Redlace admin');
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const { data, error, loading, reload } = useLoad(() => Promise.all([admin.customers(), admin.orders(), admin.subscribers()]));

  async function setRole(c, makeAdmin) {
    try {
      await admin.setAdmin(c.id, makeAdmin);
      await reload();
      toast(makeAdmin ? `${c.full_name || c.email} is now an admin` : `${c.full_name || c.email} is no longer an admin`);
    } catch (err) {
      toast(explain(err));
    }
  }

  async function copyEmails(list) {
    try {
      await navigator.clipboard.writeText(list.map((s) => s.email).join(', '));
      toast(`Copied ${list.length} ${list.length === 1 ? 'email' : 'emails'}`);
    } catch (e) {
      toast('Copying is blocked in this browser. Select the emails below instead.');
    }
  }

  if (loading && !data) return <><AdminHead title="Customers" /><Loading /></>;
  if (error) return <><AdminHead title="Customers" /><LoadError error={error} onRetry={reload} explain={explain} /></>;

  const [customers, orders, subscribers] = data;
  const stats = new Map();
  orders.forEach((o) => {
    if (!o.user_id || o.status === 'cancelled') return;
    const s = stats.get(o.user_id) || { orders: 0, spent: 0 };
    s.orders += 1; s.spent += o.total;
    stats.set(o.user_id, s);
  });
  const guests = new Set(orders.filter((o) => !o.user_id).map((o) => o.email)).size;
  const needle = q.trim().toLowerCase();
  const list = customers.filter((c) => !needle || `${c.full_name || ''} ${c.email}`.toLowerCase().includes(needle));

  return (
    <>
      <AdminHead title="Customers" note={`${customers.length} with an account, ${guests} who checked out as a guest`} />

      <div className="adm-filters">
        <label className="adm-search">
          <span className="sr">Search customers</span>
          <input type="search" placeholder="Name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <section className="adm-card">
        {list.length ? (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead><tr><th>Customer</th><th>Joined</th><th className="num">Orders</th><th className="num">Spent</th><th>Role</th><th /></tr></thead>
              <tbody>
                {list.map((c) => {
                  const s = stats.get(c.id) || { orders: 0, spent: 0 };
                  const me = c.id === user.id;
                  return (
                    <tr key={c.id}>
                      <td><b>{c.full_name || 'No name given'}</b>{me && <span className="adm-muted"> (you)</span>}<small className="adm-sub">{c.email}</small></td>
                      <td>{day(c.created_at)}</td>
                      <td className="num">{s.orders}</td>
                      <td className="num">{rupee(s.spent)}</td>
                      <td>{c.is_admin ? <span className="pill pill--admin">Admin</span> : <span className="adm-muted">Customer</span>}</td>
                      <td className="adm-actions">
                        {!me && (c.is_admin
                          ? <ConfirmButton confirm="Yes, remove admin" onConfirm={() => setRole(c, false)}>Remove admin</ConfirmButton>
                          : <ConfirmButton confirm="Yes, make admin" onConfirm={() => setRole(c, true)}>Make admin</ConfirmButton>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="adm-empty">{customers.length ? 'Nobody matches that search.' : 'No accounts yet. Customers appear here when they create one.'}</p>}
      </section>

      <section className="adm-card adm-gap" aria-labelledby="subsH">
        <header>
          <h2 id="subsH">Newsletter <small className="adm-sub">{subscribers.length} signed up</small></h2>
          {subscribers.length > 0 && <button className="btn btn--line btn--sm" type="button" onClick={() => copyEmails(subscribers)}>Copy all emails</button>}
        </header>
        {subscribers.length ? (
          <ul className="adm-list">
            {subscribers.map((s) => <li key={s.email}><span>{s.email}</span><span className="adm-muted">{day(s.created_at)}</span></li>)}
          </ul>
        ) : <p className="adm-empty">Nobody has signed up from the footer yet.</p>}
      </section>
    </>
  );
}

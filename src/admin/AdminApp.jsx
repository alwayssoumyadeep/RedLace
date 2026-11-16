import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import TLink from '../components/TLink';
import { useAuth } from '../context/AuthContext';
import { usePageReady } from '../context/PageTransition';
import { admin } from '../lib/api';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Customers from './pages/Customers';
import Messages from './pages/Messages';
import Promos from './pages/Promos';
import './admin.css';

export default function AdminApp() {
  return (
    <RequireAdmin>
      <AdminLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductEdit />} />
          <Route path="products/:id" element={<ProductEdit />} />
          <Route path="customers" element={<Customers />} />
          <Route path="messages" element={<Messages />} />
          <Route path="promos" element={<Promos />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </RequireAdmin>
  );
}

function RequireAdmin({ children }) {
  const { user, loading, signOut } = useAuth();
  const { pathname } = useLocation();
  usePageReady(null, !loading);

  if (loading) return <div className="adm-gate"><p className="adm-loading" role="status">Checking your account…</p></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (!user.isAdmin) {
    return (
      <div className="adm-gate">
        <div className="adm-gate__box">
          <p className="adm-logo">RED<span>LACE</span></p>
          <h1>This account cannot open the admin panel</h1>
          <p>You are signed in as {user.email}. Ask an existing admin to give this account admin rights, or sign in with a different account.</p>
          <div className="adm-gate__actions">
            <TLink className="btn btn--ink" to="/">Back to the shop</TLink>
            <button className="btn btn--line" type="button" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }
  return children;
}

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders', badge: 'openOrders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/messages', label: 'Messages', badge: 'newMessages' },
  { to: '/admin/promos', label: 'Promo codes' },
];

function AdminLayout({ children }) {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [counts, setCounts] = useState({ openOrders: 0, newMessages: 0 });

  // refresh the badges whenever the page changes, and every minute
  useEffect(() => {
    let live = true;
    const load = () => admin.counts().then((c) => { if (live) setCounts(c); }).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => { live = false; clearInterval(t); };
  }, [pathname]);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="adm">
      <aside className="adm__side">
        <TLink className="adm-logo" to="/" aria-label="Redlace shop">RED<span>LACE</span> <i>Admin</i></TLink>
        <nav className="adm__nav" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span>{n.label}</span>
              {n.badge && counts[n.badge] > 0 && <b aria-label={`${counts[n.badge]} need attention`}>{counts[n.badge]}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="adm__me">
          <p title={user.email}>{user.name}<small>{user.email}</small></p>
          <TLink to="/">View the shop</TLink>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="adm__main" id="main">{children}</main>
    </div>
  );
}

import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CatalogProvider } from './context/CatalogContext';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { TransitionProvider } from './context/PageTransition';
import { ToastProvider } from './context/ToastContext';
import { scrollTop, scrollToElement, useSmoothScroll } from './lib/smoothScroll';
import Curtain from './components/Curtain';
import Header from './components/Header';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
// shoppers never download the admin panel
const AdminApp = lazy(() => import('./admin/AdminApp'));

/* New page: start at the top, or at the #section the link points to. */
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { scrollTop(); return undefined; }
    const t = setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) scrollToElement(el);
    }, 120);
    return () => clearTimeout(t);
  }, [pathname, hash]);
}

function Storefront() {
  const { pathname } = useLocation();
  return (
    <>
      <Header />
      <main id="main" className={pathname === '/' ? undefined : 'page'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Cursor />
    </>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const inAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  useSmoothScroll(!inAdmin); // the admin panel scrolls natively
  useScrollOnNavigate();
  return (
    <>
      <Curtain />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
        <Route path="*" element={<Storefront />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <CatalogProvider>
      <AuthProvider>
        <StoreProvider>
          <TransitionProvider>
            <ToastProvider>
              <Shell />
            </ToastProvider>
          </TransitionProvider>
        </StoreProvider>
      </AuthProvider>
    </CatalogProvider>
  );
}

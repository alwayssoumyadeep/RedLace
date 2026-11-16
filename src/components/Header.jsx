import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TLink from './TLink';
import SearchOverlay from './SearchOverlay';
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { getLenis } from '../lib/smoothScroll';

const LINKS = [
  { to: '/shop', label: 'Shop', key: 'shop' },
  { to: '/shop?sort=new', label: 'New drops', key: 'new' },
  { to: '/orders', label: 'Your orders', key: 'orders' },
  { to: '/contact', label: 'Contact', key: 'contact' },
];

export default function Header() {
  const { count, wish } = useStore();
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const searchBtn = useRef(null);
  const searchOpenRef = useRef(false);
  searchOpenRef.current = searchOpen;

  const current = pathname === '/shop' ? (/[?&]sort=new/.test(search) ? 'new' : 'shop') : pathname.slice(1);

  const closeSearch = useCallback(() => {
    if (!searchOpenRef.current) return;
    setSearchOpen(false);
    setTimeout(() => searchBtn.current && searchBtn.current.focus(), 0);
  }, []);

  useEffect(() => {
    const tick = () => setStuck(window.scrollY > 12);
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    return () => window.removeEventListener('scroll', tick);
  }, []);

  // a new page closes the menu and the search
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname, search]);

  // white-on-red belongs to the home hero only; every other page gets the normal dark bar
  useEffect(() => {
    if (pathname !== '/') document.documentElement.removeAttribute('data-nav');
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('menu-open', menuOpen);
    root.classList.toggle('search-open', searchOpen);
    const lenis = getLenis();
    if (lenis) { if (menuOpen || searchOpen) lenis.stop(); else lenis.start(); }
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { closeSearch(); setMenuOpen(false); }
      if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeSearch]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className={'nav' + (stuck ? ' is-stuck' : '')} id="nav">
        <TLink className="nav__logo" to="/" aria-label="Redlace home">RED<span>LACE</span></TLink>
        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <TLink key={l.key} className="nav__link" to={l.to} aria-current={current === l.key ? 'page' : undefined}>{l.label}</TLink>
          ))}
        </nav>
        <div className="nav__tools">
          <button className="nav__icon" type="button" ref={searchBtn} onClick={() => setSearchOpen(true)} aria-label="Search"><SearchIcon /></button>
          <TLink className="nav__icon nav__icon--wide" to="/login" aria-label={user ? `Account: ${user.name}` : 'Sign in'}><UserIcon /></TLink>
          <TLink className="nav__icon" to="/wishlist" aria-label="Wishlist"><HeartIcon /><i className="nav__badge" hidden={!wish.length}>{wish.length}</i></TLink>
          <TLink className="nav__icon" to="/cart" aria-label="Bag"><BagIcon /><i className="nav__badge" hidden={!count}>{count}</i></TLink>
          <button className="nav__burger" type="button" aria-label="Menu" aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenuOpen((o) => !o)}><i /><i /></button>
        </div>
      </header>

      <div className="menu" id="menu" hidden={!menuOpen} data-lenis-prevent="">
        <nav aria-label="Mobile">
          <TLink to="/shop">Shop</TLink>
          <TLink to="/shop?sort=new">New drops</TLink>
          <TLink to="/orders">Your orders</TLink>
          <TLink to="/wishlist">Wishlist</TLink>
          <TLink to="/contact">Contact</TLink>
          <TLink to="/login">{user ? 'Account' : 'Sign in'}</TLink>
          {user && user.isAdmin && <TLink to="/admin">Admin</TLink>}
        </nav>
      </div>

      {searchOpen && <SearchOverlay onClose={closeSearch} />}
    </>
  );
}

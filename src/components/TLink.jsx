import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePageTransition } from '../context/PageTransition';
import { scrollToElement } from '../lib/smoothScroll';

/* A router link that plays the red curtain before the page changes. */
const TLink = forwardRef(function TLink({ to, onClick, ...rest }, ref) {
  const { go } = usePageTransition();
  const loc = useLocation();

  function handle(e) {
    if (onClick) onClick(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const url = new URL(to, window.location.origin);
    if (url.pathname === loc.pathname && url.search === loc.search) {
      const el = url.hash && document.getElementById(url.hash.slice(1));
      if (el) scrollToElement(el);
      return;
    }
    go(to);
  }

  return <Link ref={ref} to={to} onClick={handle} {...rest} />;
});

export default TLink;

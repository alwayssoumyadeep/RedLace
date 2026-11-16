import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { reduceMotion } from '../lib/util';
import { scrollTop } from '../lib/smoothScroll';
import { useCatalog } from './CatalogContext';

/* The red curtain: a full loader with a lace progress line on the first visit to the home page,
   a plain red wipe between pages after that. Pages call usePageReady() to lift it. */

const Ctx = createContext(null);
export const usePageTransition = () => useContext(Ctx);

const cache = new Map();
function load(url) {
  let entry = cache.get(url);
  if (!entry) {
    const im = new Image();
    entry = { im, done: new Promise((res) => { im.onload = im.onerror = () => res(im); }) };
    im.src = url;
    cache.set(url, entry);
  }
  return entry;
}

export function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('cover'); // cover | up | down
  const [full, setFull] = useState(pathname === '/');
  const [ready, setReady] = useState(false);
  const firstBoot = useRef(true);
  const leaving = useRef(false);
  const threadRef = useRef(null);
  const countRef = useRef(null);

  const finish = useCallback(() => {
    document.documentElement.classList.add('is-ready');
    leaving.current = false;
    setReady(true);
    setPhase('up');
  }, []);

  /* Preload `urls` behind the curtain, then lift it. Resolves with the loaded <img> elements. */
  const boot = useCallback((urls = []) => {
    const showFull = firstBoot.current && urls.length > 0;
    firstBoot.current = false;
    setFull(showFull);

    return new Promise((resolve) => {
      const entries = urls.map(load);
      const images = entries.map((e) => e.im);
      const total = entries.length || 1;
      let done = entries.length ? 0 : total;
      let finished = false, raf = 0, watch = 0, cap = 0;
      const t0 = performance.now();
      const minTime = showFull && !reduceMotion ? 1100 : 0;

      const end = () => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf); clearInterval(watch); clearTimeout(cap);
        finish();
        resolve(images);
      };
      entries.forEach((e) => e.done.then(() => { done++; }));
      const all = Promise.all(entries.map((e) => e.done)).then(() => { done = total; });
      cap = setTimeout(() => { done = total; }, 9000); // never hold the page hostage to a slow image

      if (!showFull) {
        Promise.race([all, new Promise((r) => setTimeout(r, 9000))]).then(end);
        return;
      }
      let shown = 0;
      const paint = () => {
        const target = (done / total) * 100;
        shown += (target - shown) * 0.14;
        if (target - shown < 0.4) shown = target;
        if (threadRef.current) threadRef.current.style.strokeDashoffset = 100 - shown;
        if (countRef.current) countRef.current.textContent = Math.round(shown);
        if (shown >= 100 && performance.now() - t0 >= minTime) return end();
        raf = requestAnimationFrame(paint);
      };
      raf = requestAnimationFrame(paint);
      // rAF pauses in background tabs; timers still tick
      watch = setInterval(() => {
        if (done >= total && performance.now() - t0 >= minTime + 700) end();
      }, 250);
    });
  }, [finish]);

  /* Drop the curtain, swap the page underneath, let the new page lift it again. */
  const go = useCallback((to) => {
    const swap = () => {
      navigate(to);
      if (!String(to).includes('#')) scrollTop();
    };
    if (reduceMotion) return swap();
    if (leaving.current) return undefined;
    leaving.current = true;
    setFull(false);
    setPhase('down');
    setTimeout(() => {
      document.documentElement.classList.remove('is-ready');
      setReady(false);
      swap();
    }, 420);
    return undefined;
  }, [navigate]);

  const value = useMemo(() => ({ phase, full, ready, boot, go, threadRef, countRef }), [phase, full, ready, boot, go]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Lift the curtain once the catalogue (and this page's own data, via `isReady`) has arrived,
   optionally after preloading images. */
export function usePageReady(urls, isReady = true) {
  const { boot } = usePageTransition();
  const { loaded } = useCatalog();
  const { key } = useLocation();
  const [images, setImages] = useState(null);
  const go = loaded && isReady;
  useEffect(() => {
    if (!go) return undefined;
    let live = true;
    boot(urls || []).then((im) => { if (live) setImages(im); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, go]);
  return images;
}

export function useTitle(title) {
  useEffect(() => { document.title = title; }, [title]);
}

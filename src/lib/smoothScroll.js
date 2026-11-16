import { useEffect } from 'react';
import Lenis from 'lenis';
import { reduceMotion } from './util';

let lenis = null;
export const getLenis = () => lenis;

/* Smooth wheel scrolling for the whole app. Native scrolling when the visitor prefers less motion. */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (reduceMotion || !enabled) return undefined;
    let instance;
    try {
      instance = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    } catch (e) {
      return undefined;
    }
    lenis = instance;
    let id = requestAnimationFrame(function raf(t) {
      instance.raf(t);
      id = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(id);
      instance.destroy();
      lenis = null;
    };
  }, [enabled]);
}

export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToElement(el) {
  const offset = -84; // clear the fixed bar
  if (lenis) lenis.scrollTo(el, { offset, force: true });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
}

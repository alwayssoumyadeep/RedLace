export const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const pad = (n, len = 2) => String(n).padStart(len, '0');
export const formatDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

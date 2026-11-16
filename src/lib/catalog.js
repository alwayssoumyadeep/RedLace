import { SIZES } from '../data/constants';

/* Database row (snake_case, with inventory rows) -> the shape the app uses. */
export function toProduct(r) {
  return {
    id: r.id,
    brand: r.brand,
    name: r.name,
    colorway: r.colorway,
    type: r.type,
    price: r.price,
    mrp: r.mrp,
    year: r.year,
    isNew: r.is_new,
    rating: Number(r.rating),
    reviews: r.reviews,
    blurb: r.blurb,
    details: r.details || [],
    image: r.image_url,
    spinFrames: r.spin_frames,
    active: r.active,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    stock: Object.fromEntries((r.inventory || []).map((i) => [i.size, i.stock])),
  };
}

/* main photo when n is omitted, otherwise spin frame n. Shoes without a spin set reuse the main photo. */
export function img(p, n) {
  if (!n || !p.spinFrames) return p.image || `/assets/shoes/${p.id}/main.webp`;
  return `/assets/shoes/${p.id}/s${String(n).padStart(2, '0')}.webp`;
}

/* "Jordan Air Jordan 1" reads twice, so Jordan pairs go by model name alone. */
export const label = (p) => (p.brand === 'Jordan' ? p.name : `${p.brand} ${p.name}`);
export const fullName = (p) => `${label(p)} ${p.colorway}`;
export const rupee = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
export const discount = (p) => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
export const stockOf = (p, size) => (p && p.stock && p.stock[size]) || 0;
export const soldOut = (p) => SIZES.filter((s) => stockOf(p, s) <= 0);
export const totalStock = (p) => SIZES.reduce((n, s) => n + stockOf(p, s), 0);

export function search(products, q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return products.slice();
  const words = q.split(/\s+/);
  return products.filter((p) => {
    const hay = `${p.brand} ${p.name} ${p.colorway} ${p.type}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

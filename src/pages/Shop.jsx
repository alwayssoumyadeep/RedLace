import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/ui';
import { SHAPES } from '../data/constants';
import { search } from '../lib/catalog';
import { usePageReady, useTitle } from '../context/PageTransition';
import { useCatalog } from '../context/CatalogContext';

const SORTS = [['featured', 'Sort: Featured'], ['new', 'Sort: Newest'], ['low', 'Sort: Price, low to high'], ['high', 'Sort: Price, high to low']];

function titleFor(s) {
  if (s.q) return `Results for “${s.q}”`;
  if (s.sort === 'new' && s.brand === 'All' && s.type === 'All') return 'New drops';
  if (s.type !== 'All') return `${s.type}s`;
  if (s.brand !== 'All') return s.brand;
  return 'All sneakers';
}

function filter(products, s) {
  const out = search(products, s.q).filter((p) => (s.brand === 'All' || p.brand === s.brand) && (s.type === 'All' || p.type === s.type));
  if (s.sort === 'low') out.sort((a, b) => a.price - b.price);
  else if (s.sort === 'high') out.sort((a, b) => b.price - a.price);
  else if (s.sort === 'new') out.sort((a, b) => b.isNew - a.isNew || b.year - a.year);
  return out;
}

export default function Shop() {
  const { products, error, reload } = useCatalog();
  const BRANDS = ['All', ...new Set(products.map((p) => p.brand))];
  const [params, setParams] = useSearchParams();
  const state = {
    q: params.get('q') || '',
    brand: params.get('brand') || 'All',
    type: params.get('type') || 'All',
    sort: params.get('sort') || 'featured',
  };
  const title = titleFor(state);
  const items = filter(products, state);
  usePageReady();
  useTitle(`${title} — Redlace`);

  function update(patch) {
    const next = { ...state, ...patch };
    const u = new URLSearchParams();
    if (next.q) u.set('q', next.q);
    if (next.brand !== 'All') u.set('brand', next.brand);
    if (next.type !== 'All') u.set('type', next.type);
    if (next.sort !== 'featured') u.set('sort', next.sort);
    setParams(u, { replace: true, preventScrollReset: true });
  }

  return (
    <div className="wrap" id="shop">
      <div className="page-head">
        <h1 className="d h-xl">{title}</h1>
        <p>{items.length} {items.length === 1 ? 'pair' : 'pairs'}</p>
      </div>
      <div className="filters">
        <div className="chips" role="group" aria-label="Brand">
          {BRANDS.map((b) => (
            <button key={b} className="chip" type="button" aria-pressed={state.brand === b} onClick={() => update({ brand: b })}>{b}</button>
          ))}
        </div>
        <label className="select">
          <span className="sr">Shape</span>
          <select value={state.type} onChange={(e) => update({ type: e.target.value })}>
            <option value="All">All shapes</option>
            {SHAPES.map((t) => <option key={t} value={t}>{t}s</option>)}
          </select>
        </label>
        <label className="select">
          <span className="sr">Sort</span>
          <select value={state.sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      {error ? (
        <div className="empty">
          <h2 className="d h-md">The shelf did not load</h2>
          <p>We could not reach the shop just now. Check your connection, then try again.</p>
          <button className="btn btn--ink" type="button" onClick={reload}>Try again</button>
        </div>
      ) : items.length ? (
        <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <EmptyState title="Nothing matches" text={`No sneakers fit those filters. Clear them to see all ${products.length} pairs.`} to="/shop" action="Clear filters" />
      )}
    </div>
  );
}

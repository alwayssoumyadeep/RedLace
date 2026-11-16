import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AdminHead, Loading, LoadError, useLoad } from '../shared';
import { admin, explain } from '../../lib/api';
import { img, label, rupee, soldOut, totalStock } from '../../lib/catalog';
import { SIZES } from '../../data/constants';
import { useToast } from '../../context/ToastContext';
import { useCatalog } from '../../context/CatalogContext';
import { useTitle } from '../../context/PageTransition';

const FILTERS = [['all', 'All'], ['live', 'Live'], ['hidden', 'Hidden'], ['low', 'Running low'], ['out', 'Sizes sold out']];
const isLow = (p) => SIZES.some((s) => { const n = p.stock[s] || 0; return n > 0 && n <= 2; });
const hasOut = (p) => SIZES.some((s) => (p.stock[s] || 0) === 0);

export default function Products() {
  useTitle('Products — Redlace admin');
  const navigate = useNavigate();
  const toast = useToast();
  const { reload: reloadCatalog } = useCatalog();
  const [params, setParams] = useSearchParams();
  const show = params.get('show') || 'all';
  const q = params.get('q') || '';
  const { data, error, loading, reload, setData } = useLoad(() => admin.products());

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && v !== 'all') next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  async function toggle(p) {
    setData((list) => list.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    try {
      await admin.setProductActive(p.id, !p.active);
      reloadCatalog();
      toast(p.active ? `${p.name} is hidden from the shop` : `${p.name} is live in the shop`);
    } catch (err) {
      setData((list) => list.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)));
      toast(explain(err));
    }
  }

  const products = data || [];
  const needle = q.trim().toLowerCase();
  const list = products.filter((p) => (show === 'all' || (show === 'live' && p.active) || (show === 'hidden' && !p.active) || (show === 'low' && isLow(p)) || (show === 'out' && hasOut(p)))
    && (!needle || `${p.brand} ${p.name} ${p.colorway} ${p.id}`.toLowerCase().includes(needle)));

  return (
    <>
      <AdminHead title="Products" note={data ? `${products.filter((p) => p.active).length} live, ${products.filter((p) => !p.active).length} hidden` : ''}>
        <Link className="btn btn--red btn--sm" to="/admin/products/new">Add a product</Link>
      </AdminHead>

      <div className="adm-filters">
        <div className="chips" role="group" aria-label="Show">
          {FILTERS.map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={show === k} onClick={() => setParam('show', k)}>{l}</button>)}
        </div>
        <label className="adm-search">
          <span className="sr">Search products</span>
          <input type="search" placeholder="Name, brand or colour" value={q} onChange={(e) => setParam('q', e.target.value)} />
        </label>
      </div>

      {loading && !data ? <Loading /> : error ? <LoadError error={error} onRetry={reload} explain={explain} /> : (
        <section className="adm-card">
          {list.length ? (
            <div className="adm-scroll">
              <table className="adm-table adm-table--rows">
                <thead>
                  <tr><th>Product</th><th>Shape</th><th className="num">Price</th><th className="num">In stock</th><th>Sizes out</th><th>In shop</th></tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const gone = soldOut(p);
                    const total = totalStock(p);
                    return (
                      <tr key={p.id} className={p.active ? undefined : 'is-dim'} onClick={(e) => { if (!e.target.closest('a, button, label')) navigate(`/admin/products/${p.id}`); }}>
                        <td>
                          <span className="adm-prod">
                            <span className="thumb"><img src={img(p)} alt="" loading="lazy" /></span>
                            <span><Link className="adm-strong" to={`/admin/products/${p.id}`}>{label(p)}</Link><small className="adm-sub">{p.colorway}</small></span>
                          </span>
                        </td>
                        <td>{p.type}</td>
                        <td className="num">{rupee(p.price)}</td>
                        <td className={'num' + (total <= 5 ? ' is-warn' : '')}>{total}</td>
                        <td>{gone.length ? `UK ${gone.join(', ')}` : <span className="adm-muted">None</span>}</td>
                        <td>
                          <label className="switch">
                            <input type="checkbox" checked={p.active} onChange={() => toggle(p)} aria-label={`${p.name} ${p.colorway} live in the shop`} />
                            <span>{p.active ? 'Live' : 'Hidden'}</span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-empty">{products.length ? 'No products match. Clear the search or pick another filter.' : 'No products yet. Add the first one.'}</p>}
        </section>
      )}
    </>
  );
}

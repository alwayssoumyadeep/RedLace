import { useEffect, useRef, useState } from 'react';
import TLink from './TLink';
import { CloseIcon, SearchIcon } from './Icons';
import { img, label, rupee, search } from '../lib/catalog';
import { usePageTransition } from '../context/PageTransition';
import { useCatalog } from '../context/CatalogContext';

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('');
  const input = useRef(null);
  const { go } = usePageTransition();
  const { products } = useCatalog();

  useEffect(() => {
    const t = setTimeout(() => input.current && input.current.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const query = q.trim();
  const list = query ? search(products, query).slice(0, 6) : products.filter((p) => p.isNew).slice(0, 4);

  function submit(e) {
    e.preventDefault();
    go('/shop' + (query ? '?q=' + encodeURIComponent(query) : ''));
  }

  return (
    <div className="search" id="search" role="dialog" aria-modal="true" aria-label="Search sneakers" data-lenis-prevent="">
      <div className="search__bar wrap">
        <form className="search__form" onSubmit={submit}>
          <SearchIcon />
          <input ref={input} name="q" type="search" placeholder="Search by shoe, brand or colour" autoComplete="off"
            aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <button className="nav__icon" type="button" onClick={onClose} aria-label="Close search"><CloseIcon /></button>
      </div>
      <div className="search__results wrap">
        {!list.length ? (
          <p className="search__empty">No sneakers match “{query}”. Try a brand, like Nike or adidas.</p>
        ) : (
          <>
            <p className="search__label">{query ? `${list.length} match${list.length > 1 ? 'es' : ''}` : 'New this week'}</p>
            <div className="search__list">
              {list.map((p) => (
                <TLink className="search__item" key={p.id} to={`/product/${p.id}`}>
                  <span className="search__thumb"><img src={img(p)} alt="" /></span>
                  <span><b>{label(p)}</b><small>{p.colorway}</small></span>
                  <span className="search__price">{rupee(p.price)}</span>
                </TLink>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../lib/api';

/* The live catalogue (products + stock per size) from the database. */

const Ctx = createContext(null);
export const useCatalog = () => useContext(Ctx);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setProducts(await fetchProducts());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return { products, loaded, error, reload, byId: (id) => map.get(id) };
  }, [products, loaded, error, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

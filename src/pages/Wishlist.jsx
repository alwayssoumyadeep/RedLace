import ProductCard from '../components/ProductCard';
import { EmptyState, PageHead } from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useCatalog } from '../context/CatalogContext';
import { usePageReady, useTitle } from '../context/PageTransition';

export default function Wishlist() {
  usePageReady();
  useTitle('Wishlist — Redlace');
  const { wish } = useStore();
  const { byId } = useCatalog();
  const items = wish.map(byId).filter(Boolean);
  return (
    <div className="wrap" id="wishlist">
      <PageHead title="Wishlist" note={items.length ? `${items.length} ${items.length === 1 ? 'pair' : 'pairs'} saved` : ''} />
      {items.length ? (
        <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <EmptyState title="Nothing saved yet" text="Tap the heart on any pair to keep it here for later." to="/shop" action="Browse the shop" />
      )}
    </div>
  );
}

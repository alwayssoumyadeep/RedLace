import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './CatalogContext';
import { FREE_DELIVERY_FROM, MAX_PER_LINE, STANDARD_DELIVERY } from '../data/constants';

/* What stays in this browser: the bag, the wishlist, an applied promo code and the ids of
   orders placed as a guest. Orders themselves live in the database. */

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    /* private mode: state still works for this visit */
  }
}

// the old prototype kept fake orders in the browser; they are gone now
try { ['rl_orders', 'rl_seeded', 'rl_user'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }

function usePersisted(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const { byId } = useCatalog();
  const [cart, setCart] = usePersisted('rl_cart', []);
  const [wish, setWish] = usePersisted('rl_wish', []);
  const [promoRaw, setPromo] = usePersisted('rl_promo2', null); // { code, percent }
  const [guestOrders, setGuestOrders] = usePersisted('rl_guest_orders', []);
  const promo = promoRaw && promoRaw.code ? promoRaw : null;

  const add = useCallback((id, size, qty = 1, max = MAX_PER_LINE) => {
    const cap = Math.min(MAX_PER_LINE, max);
    setCart((c) => {
      const i = c.findIndex((l) => l.id === id && l.size === size);
      if (i === -1) return [...c, { id, size, qty: Math.min(cap, qty) }];
      return c.map((l, j) => (j === i ? { ...l, qty: Math.min(cap, l.qty + qty) } : l));
    });
  }, [setCart]);

  const setQty = useCallback((index, qty) => {
    setCart((c) => (qty < 1 ? c.filter((_, j) => j !== index) : c.map((l, j) => (j === index ? { ...l, qty: Math.min(MAX_PER_LINE, qty) } : l))));
  }, [setCart]);

  const removeLine = useCallback((index) => setCart((c) => c.filter((_, j) => j !== index)), [setCart]);
  const clearCart = useCallback(() => setCart([]), [setCart]);

  const toggleWish = useCallback((id) => {
    const added = !wish.includes(id);
    setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    return added;
  }, [wish, setWish]);

  const rememberOrder = useCallback((id) => setGuestOrders((ids) => [id, ...ids.filter((x) => x !== id)].slice(0, 50)), [setGuestOrders]);

  const value = useMemo(() => {
    const lines = cart.filter((l) => byId(l.id));
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + byId(l.id).price * l.qty, 0);
    const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
    const delivery = subtotal === 0 || subtotal - discount >= FREE_DELIVERY_FROM ? 0 : STANDARD_DELIVERY;
    const totals = { subtotal, discount, delivery, total: subtotal - discount + delivery, promo: promo && promo.code };
    return {
      cart, wish, promo, guestOrders, count, totals,
      add, setQty, removeLine, clearCart, toggleWish, setPromo, rememberOrder,
      isWished: (id) => wish.includes(id),
    };
  }, [cart, wish, promo, guestOrders, byId, add, setQty, removeLine, clearCart, toggleWish, setPromo, rememberOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

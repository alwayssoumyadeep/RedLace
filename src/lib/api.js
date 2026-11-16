import { supabase } from './supabase';
import { toProduct } from './catalog';

/* Every call to the backend lives here, so pages never talk to Supabase directly. */

const PRODUCT_SELECT = '*, inventory(size, stock)';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ storefront */

export async function fetchProducts() {
  const rows = unwrap(await supabase.from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at'));
  return rows.map(toProduct);
}

/* Percent off, or null when the code is not live. */
export async function checkPromo(code) {
  return unwrap(await supabase.rpc('check_promo', { code }));
}

/* Returns { order_id, order_number }. Prices and stock are checked in the database. */
export async function placeOrder(payload) {
  const rows = unwrap(await supabase.rpc('place_order', { payload }));
  return rows[0];
}

/* Orders on the signed-in account, plus guest orders this browser placed. */
export async function getOrders(guestIds = []) {
  return unwrap(await supabase.rpc('get_orders', { order_ids: guestIds }));
}

export async function sendMessage(m) {
  unwrap(await supabase.from('messages').insert({
    name: m.name.trim(), email: m.email.trim(), topic: m.topic,
    order_number: m.order.trim() || null, message: m.message.trim(),
  }));
}

/* 'added' or 'already' */
export async function subscribe(email) {
  const { error } = await supabase.from('subscribers').insert({ email: email.trim().toLowerCase() });
  if (error && error.code === '23505') return 'already';
  if (error) throw error;
  return 'added';
}

/* ------------------------------------------------------------------ admin */

export const admin = {
  /* For the sidebar badges. */
  async counts() {
    const [open, fresh] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['placed', 'packed', 'shipped', 'out_for_delivery']),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    ]);
    if (open.error) throw open.error;
    if (fresh.error) throw fresh.error;
    return { openOrders: open.count || 0, newMessages: fresh.count || 0 };
  },
  async orders() {
    return unwrap(await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }));
  },
  async order(id) {
    return unwrap(await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle());
  },
  async setOrderStatus(id, status) {
    unwrap(await supabase.rpc('set_order_status', { p_order_id: id, p_status: status }));
  },

  async products() {
    return (unwrap(await supabase.from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at'))).map(toProduct);
  },
  async saveProduct(row, stock, isNew) {
    const q = supabase.from('products');
    unwrap(isNew ? await q.insert(row) : await q.update(row).eq('id', row.id));
    const inv = Object.entries(stock).map(([size, n]) => ({ product_id: row.id, size: Number(size), stock: Math.max(0, Number(n) || 0) }));
    if (inv.length) unwrap(await supabase.from('inventory').upsert(inv, { onConflict: 'product_id,size' }));
  },
  async setProductActive(id, active) {
    unwrap(await supabase.from('products').update({ active }).eq('id', id));
  },
  async deleteProduct(id) {
    unwrap(await supabase.from('products').delete().eq('id', id));
  },
  async uploadImage(file, productId) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${productId}/${Date.now()}.${ext}`;
    unwrap(await supabase.storage.from('product-images').upload(path, file, { cacheControl: '31536000', upsert: false }));
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  },

  async customers() {
    return unwrap(await supabase.from('profiles').select('*').order('created_at', { ascending: false }));
  },
  async setAdmin(id, isAdmin) {
    unwrap(await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', id));
  },
  async subscribers() {
    return unwrap(await supabase.from('subscribers').select('*').order('created_at', { ascending: false }));
  },

  async messages() {
    return unwrap(await supabase.from('messages').select('*').order('created_at', { ascending: false }));
  },
  async setMessageStatus(id, status) {
    unwrap(await supabase.from('messages').update({ status }).eq('id', id));
  },
  async deleteMessage(id) {
    unwrap(await supabase.from('messages').delete().eq('id', id));
  },

  async promos() {
    return unwrap(await supabase.from('promo_codes').select('*').order('created_at', { ascending: false }));
  },
  async addPromo(code, percent) {
    unwrap(await supabase.from('promo_codes').insert({ code, percent }));
  },
  async setPromoActive(code, active) {
    unwrap(await supabase.from('promo_codes').update({ active }).eq('code', code));
  },
  async deletePromo(code) {
    unwrap(await supabase.from('promo_codes').delete().eq('code', code));
  },
};

/* Turn a backend error into a sentence a shopper or admin can act on. */
export function explain(error, products = []) {
  const msg = (error && (error.message || String(error))) || '';
  const byId = (id) => products.find((p) => p.id === id);
  let m;
  if ((m = msg.match(/OUT_OF_STOCK:([^:]+):(\d+)/))) {
    const p = byId(m[1]);
    return `${p ? `${p.name} ${p.colorway}` : 'One pair'} in UK ${m[2]} just sold out. Remove it from your bag or choose another size.`;
  }
  if ((m = msg.match(/UNAVAILABLE:(.+)/))) {
    const p = byId(m[1].trim());
    return `${p ? p.name : 'One pair'} is no longer for sale. Remove it from your bag to continue.`;
  }
  if (msg.includes('INVALID_PROMO')) return 'That promo code has ended. Remove it from your bag and try again.';
  if (msg.includes('EMPTY_BAG')) return 'Your bag is empty. Add a pair before checking out.';
  if ((m = msg.match(/INVALID:(\w+)/))) return `Check the ${m[1]} field and try again.`;
  if (msg.includes('NOT_ALLOWED') || error?.code === '42501') return 'Your account is not allowed to do that. Sign in with an admin account.';
  if (msg.includes('ORDER_CANCELLED')) return 'This order is cancelled, so its status can no longer change.';
  if (error?.code === '23505') return 'Something with that name already exists. Use a different one.';
  if (error?.code === '23503') return 'This is used by existing orders. Hide it from the shop instead of deleting it.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return msg || 'Something went wrong. Try again.';
}

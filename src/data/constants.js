export const SIZES = [6, 7, 8, 9, 10, 11, 12];
export const SHAPES = ['Low-top', 'High-top', 'Runner'];
export const FREE_DELIVERY_FROM = 4999;
export const STANDARD_DELIVERY = 149;
export const EXPRESS_DELIVERY = 299;
export const MAX_PER_LINE = 6;

/* Order journey, in order. Cancelled sits outside it. */
export const STATUSES = [
  { key: 'placed', label: 'Order placed', action: 'Mark as placed' },
  { key: 'packed', label: 'Packed', action: 'Mark as packed' },
  { key: 'shipped', label: 'Shipped', action: 'Mark as shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery', action: 'Mark as out for delivery' },
  { key: 'delivered', label: 'Delivered', action: 'Mark as delivered' },
];
export const statusLabel = (key) => (key === 'cancelled' ? 'Cancelled' : (STATUSES.find((s) => s.key === key) || {}).label || key);
export const statusIndex = (key) => STATUSES.findIndex((s) => s.key === key);

export const TOPICS = ['A size or a shoe', 'An order', 'A return', 'Something else'];
export const PAYMENTS = [
  ['UPI', 'UPI', 'Google Pay, PhonePe, Paytm or any UPI app'],
  ['Card', 'Credit or debit card', 'Visa, Mastercard, RuPay'],
  ['Net banking', 'Net banking', 'All major Indian banks'],
  ['Cash on delivery', 'Cash on delivery', 'Pay the courier in cash or by UPI'],
];

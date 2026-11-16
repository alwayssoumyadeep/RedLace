import { HeartIcon } from './Icons';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

export default function WishButton({ p, className, ariaLabel }) {
  const { isWished, toggleWish } = useStore();
  const toast = useToast();
  const on = isWished(p.id);

  function click() {
    const added = toggleWish(p.id);
    toast(added ? 'Saved to wishlist' : 'Removed from wishlist', added ? { to: '/wishlist', label: 'View wishlist' } : null);
  }

  return (
    <button className={className} type="button" aria-pressed={on} aria-label={ariaLabel} onClick={click}>
      <HeartIcon />
    </button>
  );
}

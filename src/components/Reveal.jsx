import { useEffect, useRef, useState } from 'react';
import { usePageTransition } from '../context/PageTransition';
import { reduceMotion } from '../lib/util';

/* A heading whose line slides up into view the first time it is scrolled to. */
export default function Reveal({ as: Tag = 'h2', className, children, ...rest }) {
  const ref = useRef(null);
  const { ready } = usePageTransition();
  const [shown, setShown] = useState(reduceMotion);

  useEffect(() => {
    if (!ready || shown) return undefined;
    if (!('IntersectionObserver' in window)) { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ready, shown]);

  const cls = [className, shown && 'is-in'].filter(Boolean).join(' ');
  return (
    <Tag ref={ref} data-reveal="" className={cls || undefined} {...rest}>
      <span>{children}</span>
    </Tag>
  );
}

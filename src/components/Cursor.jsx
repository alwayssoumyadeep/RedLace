import { useEffect, useRef, useState } from 'react';

/* A real-shoe cursor that trails the pointer and leans into the direction of travel.
   Only on devices with a precise pointer; touch screens keep their normal behaviour. */
export default function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const shoeRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    const shoe = shoeRef.current, dot = dotRef.current, label = labelRef.current;
    root.classList.add('has-cursor');

    let mx = -100, my = -100, x = -100, y = -100, vx = 0, rot = 0, scale = 1, tScale = 1, tRot = 0, seen = false, raf = 0;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; x = mx; y = my; shoe.classList.add('is-on'); dot.classList.add('is-on'); }
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    };
    const onLeave = () => { shoe.classList.remove('is-on'); dot.classList.remove('is-on'); seen = false; };
    const onDown = () => root.classList.add('cur-down');
    const onUp = () => root.classList.remove('cur-down');
    const onOver = (e) => {
      const el = e.target.closest && e.target.closest('a, button, [role="button"], input, select, textarea, label, summary, [data-cursor]');
      const text = el && el.closest('[data-cursor]');
      const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|range|submit|button)$/.test(el.type || '');
      root.classList.toggle('cur-hover', !!el && !typing);
      root.classList.toggle('cur-type', !!typing);
      root.classList.toggle('cur-label', !!text);
      label.textContent = text ? text.getAttribute('data-cursor') : '';
      tScale = el && !typing ? 1.28 : 1;
      tRot = el && !typing ? -18 : 0;
    };

    const loop = () => {
      const px = x;
      x += (mx - x) * 0.2; y += (my - y) * 0.2;
      vx += (x - px - vx) * 0.25;                          // smoothed horizontal speed
      const lean = Math.max(-26, Math.min(26, vx * 1.6));  // lean into the direction of travel
      rot += (tRot + lean - rot) * 0.18;
      scale += ((root.classList.contains('cur-down') ? 0.82 : tScale) - scale) * 0.2;
      shoe.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseover', onOver);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      root.classList.remove('has-cursor', 'cur-hover', 'cur-type', 'cur-label', 'cur-down');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div className="cur" ref={shoeRef} aria-hidden="true">
        <img src="/assets/img/cursor-shoe.png" alt="" />
        <span className="cur__label" ref={labelRef} />
      </div>
      <div className="cur-dot" ref={dotRef} aria-hidden="true" />
    </>
  );
}

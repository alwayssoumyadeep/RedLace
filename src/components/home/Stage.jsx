import { useEffect, useLayoutEffect, useRef } from 'react';
import TLink from '../TLink';
import { clamp, pad } from '../../lib/util';
import { rupee } from '../../lib/catalog';
import { useCatalog } from '../../context/CatalogContext';

const HERO_ID = 'dunk-low-university-red';

/* The pinned hero. Scroll position drives the wipe to white and one full turn of the shoe,
   drawn from 33 studio photos onto a canvas. */

const ANGLES = [];
for (let a = 0; a < 360; a += 10) if (a !== 70 && a !== 100 && a !== 270) ANGLES.push(a); // the photographed angles we use
export const HERO_FRAMES = ANGLES.map((_, i) => `/assets/hero/${pad(i + 1)}.webp`);

const NEAREST = [];
for (let d = 0; d < 360; d++) {
  let best = 0, bd = 999;
  ANGLES.forEach((fa, i) => {
    const diff = Math.abs(((d - fa + 540) % 360) - 180);
    if (diff < bd) { bd = diff; best = i; }
  });
  NEAREST[d] = best;
}

const NOTES = [
  { side: 'l', from: 0, to: 62, title: 'Leather, all of it', text: 'A white leather base with red leather overlays stitched over the top.' },
  { side: 'r', from: 76, to: 150, title: 'Holes that breathe', text: 'A perforated toe box, and flat red laces up to a mesh tongue.' },
  { side: 'l', from: 164, to: 236, title: 'Cut below the ankle', text: 'A padded collar that sits low, the way the 1985 basketball pair did.' },
  { side: 'r', from: 248, to: 322, title: 'Name on the heel', text: 'NIKE embroidered in white across a red heel tab.' },
];
const LACE = 'M4 34 44 10 84 34 124 10 164 34 204 10 244 34 284 10 316 30';
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function Stage({ images }) {
  const { byId } = useCatalog();
  const hero = byId(HERO_ID);
  const price = rupee(hero ? hero.price : 12795);
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const tiltRef = useRef(null);
  const shadowRef = useRef(null);
  const degRef = useRef(null);
  const laceRef = useRef(null);

  // the bar starts white-on-red over the hero
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-nav', 'red');
    return () => root.removeAttribute('data-nav');
  }, []);

  useEffect(() => {
    if (!images) return undefined;
    const root = document.documentElement;
    const stage = stageRef.current, pin = pinRef.current, hero = heroRef.current, tilt = tiltRef.current;
    const shadow = shadowRef.current, degEl = degRef.current, lace = laceRef.current;
    const notes = Array.from(stage.querySelectorAll('.note'));
    const ctx = canvasRef.current.getContext('2d');
    let shown = -1;

    const draw = (i) => {
      const im = images[i];
      if (i === shown || !im || !im.complete || !im.naturalWidth) return;
      shown = i;
      ctx.clearRect(0, 0, 1120, 600);
      ctx.drawImage(im, 40, 190, 1120, 600, 0, 0, 1120, 600); // crop the 1200x800 frame to the shoe
    };

    let mx = 0, my = 0, pmx = 0, pmy = 0, lastKey = '', raf = 0;
    const onMove = (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };

    const update = () => {
      const r = stage.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      pmx += (mx - pmx) * 0.08; pmy += (my - pmy) * 0.08;
      const key = `${p.toFixed(4)}|${pmx.toFixed(3)}|${pmy.toFixed(3)}|${shown}`;
      if (key !== lastKey) {
        lastKey = key;
        const out = ease(clamp(p / 0.15, 0, 1));           // hero copy leaves, shoe levels out
        const wipe = ease(clamp((p - 0.07) / 0.15, 0, 1)); // white floods in from behind the shoe
        const tour = clamp((p - 0.17) / 0.05, 0, 1);
        const t = clamp((p - 0.22) / 0.72, 0, 1);          // one full turn
        const angle = t * 360;

        pin.style.setProperty('--out', out.toFixed(4));
        pin.style.setProperty('--wipe', (wipe * 150).toFixed(2));
        pin.style.setProperty('--tour', tour.toFixed(3));
        draw(NEAREST[Math.round(angle) % 360]);

        const free = 1 - out;
        tilt.style.transform = `translate3d(${((-pmx * 36 - hero.offsetWidth * 0.045) * free).toFixed(1)}px,${(-pmy * 24 * free).toFixed(1)}px,0) rotate(${(-13 * free).toFixed(2)}deg) scale(${(1 - 0.1 * out).toFixed(4)})`;
        const side = Math.abs(Math.cos((angle * Math.PI) / 180)); // 1 = side on, 0 = facing us
        shadow.style.setProperty('--sx', ((0.42 + 0.58 * side) * (1 - 0.1 * out)).toFixed(3));
        shadow.style.setProperty('--so', (0.35 + 0.3 * out).toFixed(2));

        degEl.textContent = pad(Math.round(angle), 3);
        lace.style.strokeDashoffset = (100 - t * 100).toFixed(2);
        notes.forEach((n) => {
          const on = tour === 1 && angle >= +n.dataset.from && angle < +n.dataset.to;
          if (n.classList.contains('is-on') !== on) n.classList.toggle('is-on', on);
        });
        const red = p < 0.16;
        if ((root.getAttribute('data-nav') === 'red') !== red) {
          if (red) root.setAttribute('data-nav', 'red'); else root.removeAttribute('data-nav');
        }
      }
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    draw(0);
    raf = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, [images]);

  return (
    <section className="stage" id="stage" ref={stageRef} aria-label="Nike Dunk Low University Red">
      <div className="stage__pin" ref={pinRef}>
        <div className="stage__glow" />
        <div className="stage__white" />

        <h1 className="stage__word d" aria-label="Nike Dunk Low University Red">
          <span><i>University</i></span>
          <span><i>Red</i></span>
        </h1>

        <div className="stage__shoe" ref={heroRef}>
          <div className="stage__shadow" ref={shadowRef} />
          <div className="stage__tilt" id="tilt" ref={tiltRef}>
            <canvas ref={canvasRef} width="1120" height="600" role="img" aria-label="Nike Dunk Low in white and university red, turning as you scroll" />
          </div>
        </div>

        <div className="stage__intro">
          <p className="stage__name">Nike Dunk Low</p>
          <p className="stage__desc">White leather, red overlays, red laces. In stock from UK 6 to 12.</p>
          <div className="stage__buy">
            <b>{price}</b>
            <TLink className="btn btn--white" to={`/product/${HERO_ID}`}>Shop the shoe</TLink>
          </div>
        </div>
        <p className="stage__hint"><i />Scroll to turn it around</p>

        <div className="stage__tour">
          {NOTES.map((n) => (
            <div key={n.from} className={`note note--${n.side}`} data-from={n.from} data-to={n.to}>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </div>
          ))}
          <div className="note note--end" data-from="336" data-to="361">
            <p>{price}, in UK 6 to 12</p>
            <TLink className="btn btn--red" to={`/product/${HERO_ID}`}>Choose your size</TLink>
          </div>

          <div className="stage__deg d" aria-hidden="true"><span ref={degRef}>000</span><small>°</small></div>
          <div className="stage__lace" aria-hidden="true">
            <svg viewBox="0 0 320 44"><path className="t" d={LACE} /><path className="f" ref={laceRef} pathLength="100" d={LACE} /></svg>
            <p>One full turn</p>
          </div>
        </div>
      </div>
    </section>
  );
}

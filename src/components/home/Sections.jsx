import { useEffect, useMemo, useRef } from 'react';
import TLink from '../TLink';
import Reveal from '../Reveal';
import ProductCard from '../ProductCard';
import { ArrowIcon, ShieldIcon, TruckIcon, UndoIcon } from '../Icons';
import { useDragScroll } from '../ui';
import { useCatalog } from '../../context/CatalogContext';

/* The home page sections below the hero. */

export function FreshRail() {
  const rail = useRef(null);
  const { products } = useCatalog();
  const fresh = useMemo(() => [...products.filter((p) => p.isNew), ...products.filter((p) => !p.isNew)].slice(0, 9), [products]);
  useDragScroll(rail);
  return (
    <section className="sec" aria-labelledby="freshH">
      <div className="wrap sec-head">
        <Reveal className="d h-lg" id="freshH">Fresh this week</Reveal>
        <TLink className="link" to="/shop?sort=new">See every new drop</TLink>
      </div>
      <div className="rail" ref={rail} tabIndex={0} aria-label="New sneakers, scroll sideways">
        {fresh.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

const BAND = ['Checked by hand', 'Free delivery over ₹4,999', '7-day returns', 'New drops every Friday'];

/* Slides only while you scroll. */
export function InfoBand() {
  const track = useRef(null);
  useEffect(() => {
    const el = track.current;
    let width = 0;
    const move = () => {
      if (!width) width = el.scrollWidth / 3;
      el.style.transform = `translate3d(${(-(window.scrollY * 0.45) % width).toFixed(1)}px,0,0)`;
    };
    const resize = () => { width = 0; move(); };
    move();
    window.addEventListener('scroll', move, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('scroll', move);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <div className="band" aria-hidden="true">
      <div className="band__track d" ref={track}>
        {[0, 1, 2].flatMap((n) => BAND.map((t) => <span key={`${n}-${t}`}>{t}</span>))}
      </div>
    </div>
  );
}

const SHAPES = [
  { type: 'Low-top', title: 'Low-tops', src: '/assets/shoes/jordan-1-low-gym-red/s03.webp', alt: 'Air Jordan 1 Low in gym red' },
  { type: 'High-top', title: 'High-tops', src: '/assets/shoes/jordan-1-high-chicago/main.webp', alt: 'Air Jordan 1 High OG Chicago' },
  { type: 'Runner', title: 'Runners', src: '/assets/shoes/air-max-90-infrared/main.webp', alt: 'Nike Air Max 90 Infrared' },
];

export function ShapeTiles() {
  const { products } = useCatalog();
  return (
    <section className="sec" aria-labelledby="shapeH">
      <div className="wrap">
        <div className="sec-head">
          <Reveal className="d h-lg" id="shapeH">Pick a shape</Reveal>
        </div>
        <div className="tiles">
          {SHAPES.map((s) => {
            const n = products.filter((p) => p.type === s.type).length;
            return (
              <TLink key={s.type} className="tile" to={`/shop?type=${s.type}`} data-cursor="Shop">
                <img src={s.src} alt={s.alt} loading="lazy" />
                <h3 className="d">{s.title}</h3>
                <p><span>{n} {n === 1 ? 'pair' : 'pairs'}</span> <ArrowIcon /></p>
              </TLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const NUMBERS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

export function ShortList() {
  const { products } = useCatalog();
  const n = products.length;
  const count = n ? `${NUMBERS[n] || n} ${n === 1 ? 'pair' : 'pairs'}.` : 'A short list.';
  return (
    <section className="sec" style={{ paddingTop: 0 }} aria-labelledby="shortH">
      <div className="wrap split">
        <TLink className="split__media" to="/shop" data-cursor="Shop all" aria-label="Shop all sneakers">
          <img src="/assets/hero/05.webp" alt="Nike Dunk Low University Red, three-quarter view" loading="lazy" />
        </TLink>
        <div className="split__body">
          <Reveal className="d h-lg" id="shortH">{count}</Reveal>
          <Reveal className="d h-lg red" aria-hidden="true">No filler.</Reveal>
          <p className="lede">We keep the list short on purpose: the reds and whites worth owning, and the black-and-white pairs that go with everything else in your wardrobe.</p>
          <TLink className="btn btn--ink" to="/shop">Shop all sneakers</TLink>
        </div>
      </div>
    </section>
  );
}

const PROMISES = [
  { Icon: ShieldIcon, title: 'Checked by hand', text: 'Every pair is opened and inspected in Bengaluru before it ships: stitching, box label, both shoes.' },
  { Icon: TruckIcon, title: 'At your door in 2 to 4 days', text: 'Free delivery on orders over ₹4,999. Track the box from our shelf to your door.' },
  { Icon: UndoIcon, title: '7 days to change your mind', text: 'Wrong size or wrong feeling, send them back unworn within a week. We pay for the pickup.' },
];

export function Promises() {
  return (
    <section className="sec" style={{ paddingTop: 0 }} aria-label="How we sell">
      <div className="wrap promise">
        {PROMISES.map(({ Icon, title, text }) => (
          <div key={title}>
            <Icon />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

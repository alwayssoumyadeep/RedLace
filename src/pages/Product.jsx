import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import TLink from '../components/TLink';
import Reveal from '../components/Reveal';
import ProductCard from '../components/ProductCard';
import WishButton from '../components/WishButton';
import { EmptyState } from '../components/ui';
import { ArrowIcon, ShieldIcon, StarIcon, TruckIcon, UndoIcon } from '../components/Icons';
import { FREE_DELIVERY_FROM, MAX_PER_LINE, SIZES } from '../data/constants';
import { discount, fullName, img, rupee, stockOf } from '../lib/catalog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useCatalog } from '../context/CatalogContext';
import { usePageReady, useTitle } from '../context/PageTransition';

/* A fresh component per shoe, so frame and size reset when you open a related pair. */
export default function ProductRoute() {
  const { id } = useParams();
  return <Product key={id} id={id} />;
}

function Product({ id }) {
  const { products, byId } = useCatalog();
  const p = byId(id);
  usePageReady();
  useTitle(p ? `${fullName(p)} — Redlace` : 'Sneaker — Redlace');

  if (!p) {
    return (
      <div className="wrap">
        <EmptyState title="That shoe has walked off" text="The link may be old, or the pair has sold through. Every pair we have right now is in the shop." to="/shop" action="Go to the shop" />
      </div>
    );
  }

  const related = products.filter((o) => o.id !== p.id && (o.brand === p.brand || o.type === p.type)).slice(0, 4);
  return (
    <div className="wrap" id="product">
      <nav className="crumbs" aria-label="Breadcrumb">
        <TLink to="/shop">Shop</TLink><span>/</span>
        <TLink to={`/shop?brand=${encodeURIComponent(p.brand)}`}>{p.brand}</TLink><span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="pdp">
        {p.spinFrames ? <Viewer p={p} /> : <Still p={p} />}
        <BuyBox p={p} />
      </div>
      {related.length > 0 && (
        <section className="sec" style={{ paddingBottom: 0 }} aria-labelledby="alsoH">
          <div className="sec-head"><Reveal className="d h-lg" id="alsoH">Goes well next to it</Reveal></div>
          <div className="grid">{related.map((o) => <ProductCard key={o.id} p={o} />)}</div>
        </section>
      )}
    </div>
  );
}

/* A single photo, for pairs added in the admin panel without a spin set. */
function Still({ p }) {
  return (
    <div className="viewer is-used" id="viewer">
      <div className="viewer__stage"><img src={img(p)} alt={fullName(p)} /></div>
    </div>
  );
}

/* Drag-to-spin through the studio photos, one every 360/N degrees. */
function Viewer({ p }) {
  const N = p.spinFrames;
  const thumbs = useMemo(() => [1, 3, 5, 10, 14].filter((n) => n <= N), [N]);
  const [frame, setFrame] = useState(1);
  const [used, setUsed] = useState(false);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const srcs = useMemo(() => Array.from({ length: N }, (_, i) => img(p, i + 1)), [p, N]);

  useEffect(() => { srcs.forEach((s) => { const im = new Image(); im.src = s; }); }, [srcs]);

  const show = (n) => setFrame((((n - 1) % N) + N) % N + 1);
  const deg = Math.round((frame - 1) * (360 / N));

  function onPointerDown(e) {
    drag.current = { x: e.clientX, frame };
    try { stageRef.current.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const step = stageRef.current.clientWidth / (N * 1.1);
    const moved = Math.round((drag.current.x - e.clientX) / step);
    if (moved) setUsed(true);
    show(drag.current.frame + moved);
  }
  const endDrag = () => { drag.current = null; };
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') { show(frame - 1); setUsed(true); e.preventDefault(); }
    if (e.key === 'ArrowRight') { show(frame + 1); setUsed(true); e.preventDefault(); }
  }

  return (
    <div className={'viewer' + (used ? ' is-used' : '')} id="viewer">
      <div className="viewer__stage" ref={stageRef} tabIndex={0} role="slider" aria-label="Turn the shoe"
        aria-valuemin={0} aria-valuemax={360 - 360 / N} aria-valuenow={deg} aria-valuetext={`${deg} degrees`} data-cursor="Drag"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={onKeyDown}>
        <img src={srcs[frame - 1]} alt={fullName(p)} width="800" height="533" />
        <span className="viewer__deg" aria-hidden="true">{deg}°</span>
        <span className="viewer__hint"><ArrowIcon />Drag to spin</span>
      </div>
      <div className="viewer__thumbs">
        {thumbs.map((n, i) => (
          <button key={n} type="button" aria-pressed={frame === n} aria-label={`View ${i + 1} of ${thumbs.length}`}
            onClick={() => { show(n); setUsed(true); }}>
            <img src={img(p, n)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

function BuyBox({ p }) {
  const { add, cart } = useStore();
  const toast = useToast();
  const [size, setSize] = useState(null);
  const [err, setErr] = useState('');
  const off = discount(p);
  const left = size ? stockOf(p, size) : 0;
  const inBag = size ? (cart.find((l) => l.id === p.id && l.size === size) || { qty: 0 }).qty : 0;

  function submit(e) {
    e.preventDefault();
    if (!size) { setErr('Choose a size, then add it to your bag.'); return; }
    if (inBag >= Math.min(left, MAX_PER_LINE)) {
      setErr(`Your bag already holds every pair we have in UK ${size}.`);
      return;
    }
    add(p.id, size, 1, left);
    toast(`Added to bag: ${p.name}, UK ${size}`, { to: '/cart', label: 'View bag' });
  }

  return (
    <div className="info">
      <p className="info__brand">{p.brand}</p>
      <h1 className="d">{p.name}</h1>
      <p className="info__cw">{p.colorway}</p>
      {p.reviews > 0 && <p className="info__rate"><StarIcon /><b>{p.rating.toFixed(1)}</b> from {p.reviews.toLocaleString('en-IN')} reviews</p>}
      <p className="info__price">
        <b>{rupee(p.price)}</b>
        {off > 0 && <><s>{rupee(p.mrp)}</s><em>{off}% off</em></>}
      </p>
      <p className="info__tax">Price includes all taxes</p>
      {p.blurb && <p className="info__blurb">{p.blurb}</p>}

      <form id="buy" noValidate onSubmit={submit}>
        <fieldset className="sizes">
          <div className="sizes__head"><legend>Size (UK)</legend><TLink className="link" to="/contact#faq">Size guide</TLink></div>
          <div className="sizes__grid">
            {SIZES.map((s) => {
              const out = stockOf(p, s) <= 0;
              return (
                <label className="size" key={s}>
                  <input type="radio" name="size" value={s} disabled={out} checked={size === s} onChange={() => { setSize(s); setErr(''); }} />
                  <span>{s}{out && <span className="sr"> sold out</span>}</span>
                </label>
              );
            })}
          </div>
          <p className="sizes__err" id="sizeErr" role="alert">
            {err || (size && left <= 3 ? `Only ${left} left in UK ${size}.` : '')}
          </p>
        </fieldset>
        <div className="info__cta">
          <button className="btn btn--red" type="submit">Add to bag</button>
          <WishButton p={p} className="wish-btn" ariaLabel="Save to wishlist" />
        </div>
      </form>

      <ul className="perks">
        <li><TruckIcon /><span>Delivered in 2 to 4 days{p.price >= FREE_DELIVERY_FROM ? ', free' : ''}</span></li>
        <li><UndoIcon /><span>Return unworn within 7 days</span></li>
        <li><ShieldIcon /><span>Checked by hand before it ships</span></li>
      </ul>

      <div className="acc">
        {p.details.length > 0 && (
          <details open>
            <summary>What it is made of</summary>
            <ul className="acc__body">{p.details.map((d) => <li key={d}>{d}</li>)}</ul>
          </details>
        )}
        <details>
          <summary>Size and fit</summary>
          <div className="acc__body"><p>Sizes are UK. Most people take their usual size in this shoe. If you are between sizes or have wide feet, go half a size up and message us; we will find the closest pair.</p></div>
        </details>
        <details>
          <summary>Delivery and returns</summary>
          <div className="acc__body"><p>Orders placed before 2pm ship the same day and arrive in 2 to 4 days. Delivery is free over ₹4,999 and ₹149 below that. Unworn pairs can come back within 7 days, and we pay for the pickup.</p></div>
        </details>
      </div>
    </div>
  );
}

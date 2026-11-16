import TLink from './TLink';
import WishButton from './WishButton';
import { discount, fullName, img, rupee, totalStock } from '../lib/catalog';

export default function ProductCard({ p }) {
  const off = discount(p);
  const href = `/product/${p.id}`;
  const gone = totalStock(p) === 0;
  return (
    <article className="card">
      <TLink className="card__media" to={href} data-cursor="View" aria-label={fullName(p)}>
        <img className="card__img" src={img(p)} alt={`${fullName(p)}, side view`} loading="lazy" width="800" height="571" />
        <img className="card__img card__img--alt" src={img(p, 3)} alt="" loading="lazy" width="800" height="533" />
        {gone ? <span className="card__tag card__tag--out">Sold out</span> : p.isNew && <span className="card__tag">New</span>}
      </TLink>
      <WishButton p={p} className="card__wish" ariaLabel={`Save ${p.name} ${p.colorway} to wishlist`} />
      <div className="card__body">
        <p className="card__brand">{p.brand}</p>
        <h3 className="card__name"><TLink to={href}>{p.name}</TLink></h3>
        <p className="card__cw">{p.colorway}</p>
        <p className="card__price">
          <b>{rupee(p.price)}</b>
          {off > 0 && <> <s>{rupee(p.mrp)}</s> <em>{off}% off</em></>}
        </p>
      </div>
    </article>
  );
}

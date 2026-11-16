import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminHead, ConfirmButton, Loading, LoadError, useLoad } from '../shared';
import { Field, focusFirstBad } from '../../components/ui';
import { admin, explain } from '../../lib/api';
import { img, label, slugify } from '../../lib/catalog';
import { SHAPES, SIZES } from '../../data/constants';
import { useToast } from '../../context/ToastContext';
import { useCatalog } from '../../context/CatalogContext';
import { useTitle } from '../../context/PageTransition';

const EMPTY = {
  brand: '', name: '', colorway: '', type: 'Low-top', year: String(new Date().getFullYear()),
  price: '', mrp: '', rating: '0', reviews: '0', blurb: '', details: '',
  isNew: true, active: true, image: null, spinFrames: 0,
};

function toForm(p) {
  return {
    brand: p.brand, name: p.name, colorway: p.colorway, type: p.type, year: p.year ? String(p.year) : '',
    price: String(p.price), mrp: String(p.mrp), rating: String(p.rating), reviews: String(p.reviews),
    blurb: p.blurb, details: p.details.join('\n'), isNew: p.isNew, active: p.active, image: p.image, spinFrames: p.spinFrames,
  };
}

export default function ProductEdit() {
  const { id } = useParams();
  const isNew = !id;
  const { data, error, loading, reload } = useLoad(() => (isNew ? Promise.resolve(null) : admin.products().then((list) => list.find((p) => p.id === id) || false)), [id]);
  useTitle(`${isNew ? 'Add a product' : 'Edit product'} — Redlace admin`);

  if (!isNew && loading && !data) return <><Back /><Loading /></>;
  if (error) return <><Back /><LoadError error={error} onRetry={reload} explain={explain} /></>;
  if (!isNew && data === false) return <><Back /><p className="adm-empty">This product does not exist. It may have been deleted.</p></>;
  return <Editor key={id || 'new'} product={isNew ? null : data} />;
}

function Editor({ product }) {
  const isNew = !product;
  const navigate = useNavigate();
  const toast = useToast();
  const { reload: reloadCatalog } = useCatalog();
  const [f, setF] = useState(product ? toForm(product) : EMPTY);
  const [stock, setStock] = useState(() => Object.fromEntries(SIZES.map((s) => [s, String(product ? product.stock[s] || 0 : 0)])));
  const [bad, setBad] = useState({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const fileRef = useRef(null);

  const slug = product ? product.id : slugify(`${f.brand} ${f.name} ${f.colorway}`);
  const preview = f.image || (product ? img(product) : null);

  useEffect(() => { setError(''); }, [f]);

  const set = (name) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((s) => ({ ...s, [name]: value }));
    setBad((b) => ({ ...b, [name]: false }));
  };

  async function upload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Use a JPG, PNG or WebP photo.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('That photo is over 5 MB. Export a smaller one and try again.'); return; }
    if (!slug) { setError('Fill in the brand, name and colour first, so the photo has somewhere to go.'); return; }
    setUploading(true);
    try {
      const url = await admin.uploadImage(file, slug);
      setF((s) => ({ ...s, image: url }));
    } catch (err) {
      setError(explain(err));
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    const price = Number(f.price), mrp = Number(f.mrp || f.price), rating = Number(f.rating), reviews = Number(f.reviews), year = Number(f.year);
    const nextBad = {
      brand: !f.brand.trim(), name: !f.name.trim(), colorway: !f.colorway.trim(),
      price: !(Number.isInteger(price) && price > 0),
      mrp: !(Number.isInteger(mrp) && mrp >= price),
      year: f.year !== '' && !(Number.isInteger(year) && year >= 1900 && year <= 2100),
      rating: !(rating >= 0 && rating <= 5),
      reviews: !(Number.isInteger(reviews) && reviews >= 0),
    };
    setBad(nextBad);
    if (Object.values(nextBad).some(Boolean)) { requestAnimationFrame(() => focusFirstBad(formRef.current)); return; }
    if (!f.image && isNew) { setError('Add a photo so the pair shows up properly in the shop.'); return; }

    setBusy(true);
    try {
      const row = {
        id: slug, brand: f.brand.trim(), name: f.name.trim(), colorway: f.colorway.trim(), type: f.type,
        year: f.year === '' ? null : year, price, mrp, rating, reviews, is_new: f.isNew, active: f.active,
        blurb: f.blurb.trim(), details: f.details.split('\n').map((d) => d.trim()).filter(Boolean),
        image_url: f.image || null,
      };
      if (isNew) row.sort_order = 1000;
      await admin.saveProduct(row, stock, isNew);
      reloadCatalog();
      toast(isNew ? `${row.name} added to the shop${row.active ? '' : ' (hidden)'}` : `${row.name} saved`);
      navigate('/admin/products');
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  }

  async function remove() {
    try {
      await admin.deleteProduct(product.id);
      reloadCatalog();
      toast(`${product.name} deleted`);
      navigate('/admin/products');
    } catch (err) {
      setError(explain(err));
    }
  }

  const total = SIZES.reduce((n, s) => n + (Number(stock[s]) || 0), 0);
  return (
    <>
      <Back />
      <AdminHead title={isNew ? 'Add a product' : label(product)} note={isNew ? 'It goes live in the shop as soon as you save, unless you hide it.' : product.colorway}>
        {!isNew && product.active && <a className="btn btn--line btn--sm" href={`/product/${product.id}`} target="_blank" rel="noreferrer">See it in the shop</a>}
      </AdminHead>

      <form className="adm-form" noValidate ref={formRef} onSubmit={save}>
        <section className="adm-card adm-pad" aria-labelledby="whatH">
          <h2 id="whatH">The shoe</h2>
          <div className="form">
            <div className="form__row form__row--3">
              <Field name="brand" label="Brand" error="Enter the brand." bad={bad.brand} value={f.brand} onChange={set('brand')} />
              <Field name="name" label="Model" error="Enter the model name." bad={bad.name} value={f.name} onChange={set('name')} />
              <Field name="colorway" label="Colourway" error="Enter the colourway." bad={bad.colorway} value={f.colorway} onChange={set('colorway')} />
            </div>
            <p className="adm-hint">
              Web address: <b>/product/{slug || '…'}</b>.{' '}
              {isNew ? 'It is set when you first save and never changes, so shared links keep working.' : 'It stays the same even if you rename the shoe.'}
            </p>
            <div className="form__row form__row--3">
              <Field name="type" label="Shape" as="select" value={f.type} onChange={set('type')}>
                {SHAPES.map((s) => <option key={s}>{s}</option>)}
              </Field>
              <Field name="year" label="Release year" error="Enter a year like 2024, or leave it empty." bad={bad.year} inputMode="numeric" value={f.year} onChange={set('year')} />
              <div className="adm-checks">
                <label className="adm-check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Live in the shop</label>
                <label className="adm-check"><input type="checkbox" checked={f.isNew} onChange={set('isNew')} /> Show the New tag</label>
              </div>
            </div>
            <Field name="blurb" label="Description" as="textarea" rows={3} value={f.blurb} onChange={set('blurb')} placeholder="One or two sentences about what makes this pair worth owning." />
            <Field name="details" label="What it is made of (one per line)" as="textarea" rows={4} value={f.details} onChange={set('details')} placeholder={'Leather upper\nRubber cupsole'} />
          </div>
        </section>

        <section className="adm-card adm-pad" aria-labelledby="priceH">
          <h2 id="priceH">Price</h2>
          <div className="form__row form__row--4">
            <Field name="price" label="Selling price (₹)" error="Enter a whole number above 0." bad={bad.price} inputMode="numeric" value={f.price} onChange={set('price')} />
            <Field name="mrp" label="MRP (₹)" error="MRP cannot be lower than the selling price." bad={bad.mrp} inputMode="numeric" value={f.mrp} onChange={set('mrp')} placeholder="Same as price" />
            <Field name="rating" label="Rating (0 to 5)" error="Enter a rating from 0 to 5." bad={bad.rating} inputMode="decimal" value={f.rating} onChange={set('rating')} />
            <Field name="reviews" label="Number of reviews" error="Enter a whole number." bad={bad.reviews} inputMode="numeric" value={f.reviews} onChange={set('reviews')} />
          </div>
        </section>

        <section className="adm-card adm-pad" aria-labelledby="photoH">
          <h2 id="photoH">Photo</h2>
          <div className="adm-photo">
            <span className="adm-photo__frame">{preview ? <img src={preview} alt="" /> : <span className="adm-muted">No photo yet</span>}</span>
            <div>
              <p>A side view on a white or transparent background looks best, like the rest of the shop. JPG, PNG or WebP, up to 5 MB.</p>
              {product && product.spinFrames > 0 && <p className="adm-hint">This pair also has a {product.spinFrames}-photo spin set, which the product page uses for drag-to-spin.</p>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden />
              <button className="btn btn--line btn--sm" type="button" disabled={uploading} onClick={() => fileRef.current.click()}>
                {uploading ? 'Uploading…' : f.image ? 'Replace photo' : 'Upload a photo'}
              </button>
            </div>
          </div>
        </section>

        <section className="adm-card adm-pad" aria-labelledby="stockH">
          <h2 id="stockH">Stock <small className="adm-sub">{total} {total === 1 ? 'pair' : 'pairs'} in total</small></h2>
          <div className="adm-stock">
            {SIZES.map((s) => (
              <label key={s} className={'adm-stock__cell' + ((Number(stock[s]) || 0) === 0 ? ' is-out' : '')}>
                <span>UK {s}</span>
                <input inputMode="numeric" value={stock[s]} onChange={(e) => setStock((st) => ({ ...st, [s]: e.target.value.replace(/\D/g, '').slice(0, 4) }))} aria-label={`Pairs in UK ${s}`} />
              </label>
            ))}
          </div>
        </section>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="adm-form__bar">
          <button className="btn btn--red" type="submit" disabled={busy || uploading}>{busy ? 'Saving…' : isNew ? 'Add to the shop' : 'Save changes'}</button>
          <Link className="btn btn--line" to="/admin/products">Cancel</Link>
          {!isNew && (
            <span className="adm-form__danger">
              <ConfirmButton confirm="Yes, delete it for good" onConfirm={remove}>Delete product</ConfirmButton>
            </span>
          )}
        </div>
        {!isNew && <p className="adm-hint">Deleting removes the pair from the shop for good. Past orders keep their own copy of the name and price. To take it down for a while, untick Live in the shop instead.</p>}
      </form>
    </>
  );
}

function Back() {
  return <Link className="adm-back" to="/admin/products">← All products</Link>;
}

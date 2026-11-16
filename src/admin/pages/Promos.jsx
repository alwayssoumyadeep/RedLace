import { useState } from 'react';
import { AdminHead, ConfirmButton, Loading, LoadError, day, useLoad } from '../shared';
import { admin, explain } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useTitle } from '../../context/PageTransition';

export default function Promos() {
  useTitle('Promo codes — Redlace admin');
  const toast = useToast();
  const { data, error, loading, reload, setData } = useLoad(() => Promise.all([admin.promos(), admin.orders()]));
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const p = Number(percent);
    if (!/^[A-Z0-9]{3,20}$/.test(c)) { setFormError('Use 3 to 20 letters or numbers, no spaces.'); return; }
    if (!(Number.isInteger(p) && p >= 1 && p <= 90)) { setFormError('Choose a discount from 1% to 90%.'); return; }
    setBusy(true);
    setFormError('');
    try {
      await admin.addPromo(c, p);
      setCode('');
      await reload();
      toast(`${c} is live: ${p}% off`);
    } catch (err) {
      setFormError(err && err.code === '23505' ? `${c} already exists. Pick another code.` : explain(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(pr) {
    setData(([list, orders]) => [list.map((x) => (x.code === pr.code ? { ...x, active: !pr.active } : x)), orders]);
    try {
      await admin.setPromoActive(pr.code, !pr.active);
      toast(pr.active ? `${pr.code} paused` : `${pr.code} is live again`);
    } catch (err) {
      reload();
      toast(explain(err));
    }
  }
  async function remove(pr) {
    try {
      await admin.deletePromo(pr.code);
      await reload();
      toast(`${pr.code} deleted`);
    } catch (err) {
      toast(explain(err));
    }
  }

  const [promos, orders] = data || [[], []];
  const used = (c) => orders.filter((o) => o.promo_code === c && o.status !== 'cancelled').length;

  return (
    <>
      <AdminHead title="Promo codes" note="Shoppers type these in their bag. The discount comes off the pairs, before delivery." />

      <form className="adm-card adm-pad adm-inline" onSubmit={add} noValidate>
        <label className="field">
          <span>New code</span>
          <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setFormError(''); }} placeholder="DIWALI15" maxLength={20} autoComplete="off" />
        </label>
        <label className="field">
          <span>Discount (%)</span>
          <input value={percent} inputMode="numeric" onChange={(e) => { setPercent(e.target.value.replace(/\D/g, '').slice(0, 2)); setFormError(''); }} />
        </label>
        <button className="btn btn--red btn--sm" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add code'}</button>
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </form>

      {loading && !data ? <Loading /> : error ? <LoadError error={error} onRetry={reload} explain={explain} /> : (
        <section className="adm-card adm-gap">
          {promos.length ? (
            <div className="adm-scroll">
              <table className="adm-table">
                <thead><tr><th>Code</th><th className="num">Off</th><th className="num">Orders</th><th>Added</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {promos.map((pr) => (
                    <tr key={pr.code} className={pr.active ? undefined : 'is-dim'}>
                      <td><b className="adm-code">{pr.code}</b></td>
                      <td className="num">{pr.percent}%</td>
                      <td className="num">{used(pr.code)}</td>
                      <td>{day(pr.created_at)}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={pr.active} onChange={() => toggle(pr)} aria-label={`${pr.code} live`} />
                          <span>{pr.active ? 'Live' : 'Paused'}</span>
                        </label>
                      </td>
                      <td className="adm-actions"><ConfirmButton confirm="Yes, delete it" onConfirm={() => remove(pr)}>Delete</ConfirmButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="adm-empty">No promo codes yet. Add one above.</p>}
        </section>
      )}
    </>
  );
}

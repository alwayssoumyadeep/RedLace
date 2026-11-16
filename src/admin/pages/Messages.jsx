import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHead, ConfirmButton, Loading, LoadError, useLoad, when } from '../shared';
import { admin, explain } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useTitle } from '../../context/PageTransition';

const FILTERS = [['new', 'New'], ['replied', 'Replied'], ['all', 'All']];

export default function Messages() {
  useTitle('Messages — Redlace admin');
  const toast = useToast();
  const [show, setShow] = useState('new');
  const { data, error, loading, reload, setData } = useLoad(() => admin.messages());

  async function mark(m, status) {
    setData((list) => list.map((x) => (x.id === m.id ? { ...x, status } : x)));
    try {
      await admin.setMessageStatus(m.id, status);
      toast(status === 'replied' ? `Marked ${m.name}'s message as replied` : `Moved ${m.name}'s message back to new`);
    } catch (err) {
      setData((list) => list.map((x) => (x.id === m.id ? { ...x, status: m.status } : x)));
      toast(explain(err));
    }
  }
  async function remove(m) {
    try {
      await admin.deleteMessage(m.id);
      setData((list) => list.filter((x) => x.id !== m.id));
      toast(`Deleted ${m.name}'s message`);
    } catch (err) {
      toast(explain(err));
    }
  }

  const all = data || [];
  const list = all.filter((m) => show === 'all' || m.status === show);
  const count = (k) => (k === 'all' ? all.length : all.filter((m) => m.status === k).length);

  return (
    <>
      <AdminHead title="Messages" note="Everything sent from the contact page." />
      <div className="adm-filters">
        <div className="chips" role="group" aria-label="Show">
          {FILTERS.map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={show === k} onClick={() => setShow(k)}>{l} <span className="chip__n">{count(k)}</span></button>
          ))}
        </div>
      </div>

      {loading && !data ? <Loading /> : error ? <LoadError error={error} onRetry={reload} explain={explain} /> : list.length ? (
        <div className="adm-msgs">
          {list.map((m) => (
            <article key={m.id} className={'adm-card adm-msg' + (m.status === 'new' ? ' is-new' : '')}>
              <header>
                <div>
                  <h2>{m.name}</h2>
                  <p className="adm-sub">{m.email} · {when(m.created_at)}</p>
                </div>
                <span className="pill pill--topic">{m.topic}</span>
              </header>
              {m.order_number && <p className="adm-msg__order">About order <Link className="link" to={`/admin/orders?q=${encodeURIComponent(m.order_number)}`}>{m.order_number}</Link></p>}
              <p className="adm-msg__body">{m.message}</p>
              <div className="adm-msg__actions">
                <a className="btn btn--ink btn--sm" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Redlace')}`}>Reply by email</a>
                {m.status === 'new'
                  ? <button className="btn btn--line btn--sm" type="button" onClick={() => mark(m, 'replied')}>Mark as replied</button>
                  : <button className="btn btn--line btn--sm" type="button" onClick={() => mark(m, 'new')}>Move back to new</button>}
                <ConfirmButton confirm="Yes, delete it" onConfirm={() => remove(m)}>Delete</ConfirmButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="adm-empty adm-card">{show === 'new' ? 'No new messages. You are all caught up.' : 'No messages here yet.'}</p>
      )}
    </>
  );
}

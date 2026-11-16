import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TLink from '../components/TLink';
import { Field, focusFirstBad } from '../components/ui';
import { isEmail } from '../lib/util';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageReady, usePageTransition, useTitle } from '../context/PageTransition';

function Art() {
  return (
    <div className="auth__art" aria-hidden="true">
      <p className="d auth__word">Lace<br />up.</p>
      <img src="/assets/hero/05.webp" alt="" />
    </div>
  );
}

/* only same-site paths, so a crafted link cannot bounce people elsewhere */
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

export default function Login() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  usePageReady(null, !loading);
  useTitle('Sign in — Redlace');
  const toast = useToast();
  const { go } = usePageTransition();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [mode, setMode] = useState(params.get('mode') === 'create' ? 'up' : 'in');
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [bad, setBad] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmFor, setConfirmFor] = useState('');
  const formRef = useRef(null);
  const justSignedIn = useRef(false);
  const create = mode === 'up';

  // after signing in, carry on to where the visitor was heading
  useEffect(() => {
    if (user && justSignedIn.current && next) { justSignedIn.current = false; go(next); }
  }, [user, next, go]);

  const set = (name) => (e) => {
    setV((s) => ({ ...s, [name]: e.target.value }));
    setBad((b) => ({ ...b, [name]: false }));
    setError('');
  };
  const switchTo = (m) => { setMode(m); setBad({}); setError(''); };

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const nextBad = { email: !isEmail(v.email), password: v.password.length < 8 };
    if (create) nextBad.name = v.name.trim().length < 2;
    setBad(nextBad);
    if (Object.values(nextBad).some(Boolean)) {
      requestAnimationFrame(() => focusFirstBad(formRef.current));
      return;
    }
    setBusy(true);
    setError('');
    if (create) {
      const res = await signUp(v.name, v.email, v.password);
      setBusy(false);
      if (res.error) { setError(res.error); return; }
      if (res.confirm) { setConfirmFor(v.email.trim()); setV({ name: '', email: '', password: '' }); return; }
      justSignedIn.current = true;
      toast('Account created');
    } else {
      justSignedIn.current = true;
      const err = await signIn(v.email, v.password);
      setBusy(false);
      if (err) { justSignedIn.current = false; setError(err); return; }
      toast('Signed in');
    }
    setV({ name: '', email: '', password: '' });
  }

  if (loading) return <div className="wrap auth" id="auth"><Art /><div className="auth__panel" /></div>;

  if (user) {
    return (
      <div className="wrap auth" id="auth">
        <Art />
        <div className="auth__panel">
          <h1 className="d">Hello, {user.name.split(' ')[0]}</h1>
          <p className="auth__sub">Signed in as {user.email}.</p>
          <div className="auth__links">
            <TLink className="btn btn--ink" to="/orders">Your orders</TLink>
            {user.isAdmin && <TLink className="btn btn--red" to="/admin">Open the admin panel</TLink>}
            <TLink className="btn btn--line" to="/wishlist">Wishlist</TLink>
            <TLink className="btn btn--line" to="/shop">Keep shopping</TLink>
          </div>
          <button className="link" type="button" onClick={async () => { await signOut(); setMode('in'); toast('Signed out'); }}>Sign out</button>
        </div>
      </div>
    );
  }

  if (confirmFor) {
    return (
      <div className="wrap auth" id="auth">
        <Art />
        <div className="auth__panel">
          <h1 className="d">Check your inbox</h1>
          <p className="auth__sub">We sent a link to {confirmFor}. Open it to confirm your email, then sign in here.</p>
          <div className="auth__links">
            <button className="btn btn--ink" type="button" onClick={() => { setConfirmFor(''); switchTo('in'); }}>Back to sign in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap auth" id="auth">
      <Art />
      <div className="auth__panel">
        <h1 className="d">{create ? 'Create account' : 'Sign in'}</h1>
        <p className="auth__sub">
          {next === '/admin' || (next && next.startsWith('/admin/')) ? 'Sign in with an admin account to open the admin panel.'
            : create ? 'Follow your orders, keep a wishlist and check out faster.' : 'Good to see you again.'}
        </p>
        <div className="seg" role="tablist" aria-label="Sign in or create an account" data-mode={mode}>
          <button type="button" role="tab" aria-selected={!create} onClick={() => switchTo('in')}>Sign in</button>
          <button type="button" role="tab" aria-selected={create} onClick={() => switchTo('up')}>Create account</button>
        </div>
        <form className="form" id="authForm" noValidate ref={formRef} onSubmit={submit}>
          {create && <Field name="name" label="Full name" error="Enter your name." bad={bad.name} autoComplete="name" value={v.name} onChange={set('name')} />}
          <Field name="email" label="Email" error="Enter an email like you@example.com." bad={bad.email} type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={set('email')} />
          <div className={'field' + (bad.password ? ' is-bad' : '')} data-f="password">
            <label htmlFor="pw">Password</label>
            <div className="field__pw">
              <input id="pw" name="password" type={showPw ? 'text' : 'password'} autoComplete={create ? 'new-password' : 'current-password'} value={v.password} onChange={set('password')} />
              <button type="button" aria-pressed={showPw} onClick={() => setShowPw((s) => !s)}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            <small>Use at least 8 characters.</small>
          </div>
          {!create && <p className="auth__forgot"><TLink className="link" to="/contact">Forgot your password?</TLink></p>}
          {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
          <button className="btn btn--red btn--block" type="submit" disabled={busy}>
            {busy ? (create ? 'Creating account…' : 'Signing in…') : (create ? 'Create account' : 'Sign in')}
          </button>
        </form>
      </div>
    </div>
  );
}

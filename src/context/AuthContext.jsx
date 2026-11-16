import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

/* Real accounts through Supabase Auth. The profile row says whether someone is an admin. */

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const nameFromEmail = (email) =>
  (email || '').split('@')[0].replace(/[._\d]+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase()) || 'there';

function explainAuth(error) {
  const m = (error && error.message) || '';
  if (/invalid login credentials/i.test(m)) return 'That email and password do not match. Check them and try again.';
  if (/email not confirmed/i.test(m)) return 'Confirm your email first: open the link we sent you, then sign in.';
  if (/already registered|already been registered/i.test(m)) return 'An account with this email already exists. Sign in instead.';
  if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
  if (/password/i.test(m)) return m;
  if (/Failed to fetch|network/i.test(m)) return 'Could not reach the server. Check your connection and try again.';
  return m || 'Something went wrong. Try again.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined while we ask Supabase
  const [profile, setProfile] = useState(null);
  const [profileFor, setProfileFor] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session && session.user ? session.user.id : null;

  const loadProfile = useCallback(async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfile(data);
    setProfileFor(id);
  }, []);

  useEffect(() => {
    if (uid) loadProfile(uid);
    else { setProfile(null); setProfileFor(null); }
  }, [uid, loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? explainAuth(error) : null;
  }, []);

  /* Resolves to { error } or { confirm: true } when Supabase wants the email confirmed first. */
  const signUp = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) return { error: explainAuth(error) };
    return { confirm: !data.session };
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = useMemo(() => {
    const loading = session === undefined || (!!uid && profileFor !== uid);
    const email = session && session.user ? session.user.email : '';
    const user = uid ? {
      id: uid,
      email,
      name: (profile && profile.full_name) || nameFromEmail(email),
      phone: profile && profile.phone,
      isAdmin: !!(profile && profile.is_admin),
    } : null;
    return { user, loading, signIn, signUp, signOut, refreshProfile: () => uid && loadProfile(uid) };
  }, [session, uid, profile, profileFor, signIn, signUp, signOut, loadProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

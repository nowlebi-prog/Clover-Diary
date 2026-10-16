import { supabase } from '../supabaseClient.js';
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, message: error.message } : { ok: true, session: data.session };
}
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
export async function logout() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

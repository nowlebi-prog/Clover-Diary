import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Vercel 환경변수(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)가 설정되지 않으면
// null을 반환해서, 앱이 죽지 않고 "설정 안내" 화면을 보여줄 수 있게 한다.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

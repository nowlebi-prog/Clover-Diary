import { supabase, isSupabaseConfigured } from "../supabaseClient";

// 실제 Supabase Auth 어댑터. 로그인/회원가입은 이메일+비밀번호를 사용한다.
// (개인용 앱이라 이메일 인증은 Supabase 프로젝트 설정에서 꺼둬도 무방)

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? { user: data.session.user } : null;
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? { user: session.user } : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function login(email, password) {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase 설정이 안 되어 있어요." };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: translateError(error.message) };
  return { ok: true, session: { user: data.user } };
}

export async function signUp(email, password) {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase 설정이 안 되어 있어요." };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: translateError(error.message) };
  if (!data.session) {
    return { ok: true, needsConfirm: true, message: "가입 완료! 메일함에서 인증 링크를 확인해주세요." };
  }
  return { ok: true, session: { user: data.user } };
}

export async function logout() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

function translateError(message = "") {
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (message.includes("already registered")) return "이미 가입된 이메일이에요. 로그인해주세요.";
  if (message.includes("Password should be")) return "비밀번호는 6자 이상이어야 해요.";
  return message || "오류가 발생했어요. 다시 시도해주세요.";
}

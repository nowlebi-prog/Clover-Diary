import { isSupabaseConfigured } from "../supabaseClient";
import * as local from "./localAuthAdapter";
import * as cloud from "./supabaseAuthAdapter";

export const usingCloud = isSupabaseConfigured;

// 두 어댑터 모두 { user: { id, ... } } 형태의 session을 반환하도록 통일.
export async function getSessionAsync() {
  if (usingCloud) return cloud.getSession();
  return local.getSession();
}

export async function login(idOrEmail, password) {
  if (usingCloud) return cloud.login(idOrEmail, password);
  const result = local.login(idOrEmail, password);
  return result;
}

export async function signUp(email, password) {
  if (usingCloud) return cloud.signUp(email, password);
  return { ok: false, message: "클라우드 동기화가 설정되지 않아 회원가입을 지원하지 않아요." };
}

export async function logout() {
  if (usingCloud) return cloud.logout();
  return local.logout();
}

export function onAuthChange(callback) {
  if (usingCloud) return cloud.onAuthChange(callback);
  return () => {};
}

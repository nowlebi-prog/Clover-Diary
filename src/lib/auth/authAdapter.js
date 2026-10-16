import { isSupabaseConfigured } from "../supabaseClient.js";
import * as local from "./localAuthAdapter.js";
import * as cloud from "./supabaseAuthAdapter.js";

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
  return { ok: false, message: "기존 Supabase 계정으로 로그인해주세요." };
}

export async function logout() {
  if (usingCloud) return cloud.logout();
  local.logout();
  window.dispatchEvent(new Event("clover-auth-change"));
}

export function onAuthChange(callback) {
  if (usingCloud) return cloud.onAuthChange(callback);
  const listener = () => callback(local.getSession());
  window.addEventListener("clover-auth-change", listener);
  return () => window.removeEventListener("clover-auth-change", listener);
}

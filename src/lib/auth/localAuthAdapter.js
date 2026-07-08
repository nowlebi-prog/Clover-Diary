import { STORAGE_KEYS } from "../storage/storageKeys";

const DEMO_USER = { username: "eunbibi", password: "986454" };

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth));
  } catch {
    return null;
  }
}

export function login(username, password) {
  // MVP-only local login. This is not real security; replace with Supabase Auth later.
  if (username === DEMO_USER.username && password === DEMO_USER.password) {
    const session = { user: { id: "local-user-eunbibi", username }, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(session));
    return { ok: true, session };
  }
  return { ok: false, message: "아이디 또는 비밀번호가 맞지 않아요." };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

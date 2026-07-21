import { STORAGE_KEYS } from "../storage/storageKeys";

const LOCAL_USERNAME = import.meta.env.VITE_LOCAL_USERNAME || "eunbibi";
const LOCAL_PASSWORD = import.meta.env.VITE_LOCAL_PASSWORD || "";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth));
  } catch {
    return null;
  }
}

export function login(username, password) {
  if (!LOCAL_PASSWORD) {
    return {
      ok: false,
      message: "로컬 로그인 비밀번호가 설정되지 않았어요. VITE_LOCAL_PASSWORD 환경변수를 설정해주세요."
    };
  }

  if (username === LOCAL_USERNAME && password === LOCAL_PASSWORD) {
    const session = { user: { id: "local-user-eunbibi", username }, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(session));
    return { ok: true, session };
  }
  return { ok: false, message: "아이디 또는 비밀번호가 맞지 않아요." };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.auth);
  sessionStorage.removeItem("clover-money-unlocked");
}

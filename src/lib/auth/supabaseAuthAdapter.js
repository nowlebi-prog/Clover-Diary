// Future adapter placeholder. Keep the UI talking to auth adapters, not directly to a provider.
export async function login() {
  throw new Error("Supabase Auth is not connected yet.");
}

export async function logout() {
  throw new Error("Supabase Auth is not connected yet.");
}

export async function getSession() {
  return null;
}

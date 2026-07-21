const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SNAPSHOT_ID = import.meta.env.VITE_CLOVER_SYNC_ID || "";
const TABLE = import.meta.env.VITE_CLOVER_SYNC_TABLE || "clover_app_snapshots";
const PUBLIC_SNAPSHOT_SYNC_ENABLED = import.meta.env.VITE_ENABLE_PUBLIC_SNAPSHOT_SYNC === "true";

const enabled = Boolean(PUBLIC_SNAPSHOT_SYNC_ENABLED && SUPABASE_URL && SUPABASE_ANON_KEY && SNAPSHOT_ID);

const endpoint = (query = "") => `${SUPABASE_URL}/rest/v1/${TABLE}${query}`;

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

export function isCloudSyncEnabled() {
  return enabled;
}

export async function pullRemoteSnapshot() {
  if (!enabled) return null;
  const response = await fetch(endpoint(`?id=eq.${encodeURIComponent(SNAPSHOT_ID)}&select=id,data,updated_at&limit=1`), {
    headers
  });
  if (!response.ok) throw new Error(`Supabase pull failed: ${response.status}`);
  const rows = await response.json();
  return rows?.[0] || null;
}

export async function pushRemoteSnapshot(data) {
  if (!enabled) return null;
  const response = await fetch(endpoint("?on_conflict=id"), {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id: SNAPSHOT_ID,
      data,
      updated_at: new Date().toISOString()
    })
  });
  if (!response.ok) throw new Error(`Supabase push failed: ${response.status}`);
  const rows = await response.json();
  return rows?.[0] || null;
}

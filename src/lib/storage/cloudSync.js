import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { getAllData, saveAllData } from "./localStorageAdapter";

const TABLE = "app_data";
const PUSH_DELAY = 1200;

let currentUserId = null;
let pushTimer = null;
let pulling = false;

async function pushToCloud() {
  if (!isSupabaseConfigured || !currentUserId) return;
  const data = getAllData();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: currentUserId, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error("[cloudSync] push failed:", error.message);
}

function scheduleDebouncedPush() {
  if (pulling || !currentUserId) return; // 방금 서버에서 받아온 직후엔 되쏘지 않음
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushToCloud, PUSH_DELAY);
}

function handleLocalChange() {
  scheduleDebouncedPush();
}

// 로그인 직후 1회 호출: 서버 데이터를 로컬로 받아오고(없으면 로컬 것을 서버로 초기 업로드),
// 이후부터는 로컬 변경이 생길 때마다 자동으로 서버에 반영한다.
export async function startCloudSync(userId) {
  currentUserId = userId;
  window.removeEventListener("clover-data-change", handleLocalChange);
  window.addEventListener("clover-data-change", handleLocalChange);
  if (!isSupabaseConfigured) return { synced: false };

  pulling = true;
  try {
    const { data: row, error } = await supabase.from(TABLE).select("data").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (row?.data) {
      saveAllData(row.data);
    } else {
      await supabase.from(TABLE).insert({ user_id: userId, data: getAllData() });
    }
    return { synced: true };
  } catch (error) {
    console.error("[cloudSync] initial sync failed:", error.message);
    return { synced: false, error: error.message };
  } finally {
    pulling = false;
  }
}

export function stopCloudSync() {
  clearTimeout(pushTimer);
  currentUserId = null;
  window.removeEventListener("clover-data-change", handleLocalChange);
}

export function forcePushNow() {
  clearTimeout(pushTimer);
  return pushToCloud();
}

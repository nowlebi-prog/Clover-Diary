import { supabase, isSupabaseConfigured } from '../supabaseClient.js';
import { createSyncEngine } from './syncEngine.js';
import { STORAGE_KEYS } from './storageKeys.js';
import { getAllData, saveAllData, getStorageUser, getSyncState, updateSyncState, archiveSyncConflicts, normalizeSnapshot } from './localStorageAdapter.js';

let active = null;
let cleanup = () => {};
export function getCloudSyncStatus() {
  let meta;
  try { meta = getSyncState(); } catch (error) { meta = { lastSyncStatus: 'error', lastSyncError: error.message }; }
  return { ...meta, enabled: isSupabaseConfigured, authenticated: Boolean(active),
    offline: typeof navigator !== 'undefined' && !navigator.onLine };
}
export function syncAllDataFromCloud() {
  return active ? active.engine.sync() : Promise.resolve({ enabled: false, synced: false });
}
export const forcePushNow = syncAllDataFromCloud;
export function stopCloudSync() { active = null; cleanup(); cleanup = () => {}; }
export function startCloudSync(userId) {
  stopCloudSync();
  if (!isSupabaseConfigured || !userId || getStorageUser() !== userId) return stopCloudSync;
  const session = { userId };
  const valid = () => active === session && getStorageUser() === userId;
  session.engine = createSyncEngine({
    readLocal: getAllData, readState: getSyncState, writeState: updateSyncState,
    applyRemote: data => saveAllData(data, { skipRemote: true }),
    isActive: valid, archiveConflicts: archiveSyncConflicts,
    pull: async () => {
      const { data, error } = await supabase.from('app_data').select('data,revision,updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data?.data && typeof data.data === 'object' && !Array.isArray(data.data)
        ? { ...data, data: normalizeSnapshot(data.data) } : data;
    },
    commit: async (data, revision) => {
      const { data: rows, error } = await supabase.rpc('save_app_data', { p_user_id: userId, p_data: data, p_expected_revision: revision });
      if (error) throw error;
      return rows?.length ? { ...rows[0], data } : null;
    }
  });
  active = session;
  let debounce;
  const sync = () => { if (valid()) void session.engine.sync(); };
  const onWrite = () => { clearTimeout(debounce); debounce = setTimeout(sync, 350); };
  const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
  const onStorage = event => {
    if (!event.key || event.key === `${STORAGE_KEYS.appData}:user:${encodeURIComponent(userId)}`) {
      window.dispatchEvent(new Event('clover-data-change'));
      onWrite();
    }
    if (!event.key || event.key.startsWith(STORAGE_KEYS.syncMeta)) window.dispatchEvent(new Event('clover-sync-status'));
  };
  const interval = setInterval(sync, 5000);
  window.addEventListener('clover-local-write', onWrite);
  window.addEventListener('online', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('pagehide', sync);
  window.addEventListener('storage', onStorage);
  document.addEventListener('visibilitychange', onVisible);
  cleanup = () => {
    clearTimeout(debounce); clearInterval(interval);
    window.removeEventListener('clover-local-write', onWrite);
    window.removeEventListener('online', sync);
    window.removeEventListener('focus', sync);
    window.removeEventListener('pagehide', sync);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', onVisible);
  };
  sync();
  return () => { if (active === session) stopCloudSync(); };
}

import { mergeSnapshots, snapshotsEqual } from './snapshotMerge.js';

// Network and durable storage boundaries are injected so races can be tested directly.
export function createSyncEngine({ readLocal, applyRemote, readState, writeState, pull, commit, isActive, archiveConflicts }) {
  let running = null;
  async function run() {
    try {
      writeState({ lastSyncStatus: 'syncing', lastSyncError: '' });
      for (let attempt = 0; attempt < 5; attempt++) {
        const row = await pull();
        if (!isActive()) return;
        if (row && (!row.data || typeof row.data !== 'object' || Array.isArray(row.data) || !Number.isSafeInteger(row.revision) || row.revision < 1)) {
          throw new Error('서버 저장 형식이 맞지 않습니다. Supabase 동기화 마이그레이션을 확인해주세요.');
        }
        const current = readLocal();
        const merged = mergeSnapshots(readState().baseline, current, row?.data || {});
        if (merged.conflicts.length) archiveConflicts(merged.conflicts);
        const uploaded = row && snapshotsEqual(merged.data, row.data)
          ? row : await commit(merged.data, row?.revision || 0);
        if (!isActive()) return;
        if (!uploaded) continue; // Another device won the revision check: pull and merge again.

        // Preserve edits made while the upload was running.
        const afterUpload = mergeSnapshots(current, readLocal(), uploaded.data);
        if (afterUpload.conflicts.length) archiveConflicts(afterUpload.conflicts);
        if (!snapshotsEqual(readLocal(), afterUpload.data)) applyRemote(afterUpload.data);
        const pending = !snapshotsEqual(readLocal(), uploaded.data);
        writeState({ baseline: uploaded.data, revision: uploaded.revision, pending,
          lastRemoteUpdatedAt: uploaded.updated_at || '',
          lastSyncedAt: new Date().toISOString(), lastSyncStatus: pending ? 'pending' : 'saved', lastSyncError: '' });
        if (!pending) return { synced: true };
      }
      writeState({ pending: true, lastSyncStatus: 'pending' });
      return { synced: false };
    } catch (error) {
      if (isActive()) writeState({ pending: true, lastSyncStatus: 'error', lastSyncError: error?.message || '동기화 실패' });
      return { synced: false, error };
    }
  }
  return { sync() {
    if (!isActive()) return Promise.resolve({ synced: false });
    if (!running) running = run().finally(() => { running = null; });
    return running;
  } };
}

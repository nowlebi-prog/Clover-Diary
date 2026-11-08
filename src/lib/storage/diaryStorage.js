import { STORAGE_KEYS } from './storageKeys.js';

const buckets = ['appData', 'appDataBackup', 'syncMeta', 'recovery'].map(name => STORAGE_KEYS[name]);
const isDiaryKey = key => typeof key === 'string' && buckets.some(prefix => key === prefix || key.startsWith(`${prefix}:user:`));
const storeName = 'snapshots';

export function createDiaryStorage({ indexedDB, legacy, onStatus = () => {}, onCommit = () => {}, onRefresh = () => {} }) {
  let db, active, error, generation = 0;
  let disk = new Map();
  const drafts = new Map();
  const status = () => ({ pending: drafts.size > 0, error });
  const read = (mode, callback) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    let result, failure;
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(failure || tx.error || new Error('기기 저장이 중단됐어요.'));
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      try { result = callback(new Map(request.result.map(({ key, value }) => [key, value])), store); }
      catch (err) { failure = err; tx.abort(); }
    };
  });
  async function open() {
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('clover-diary-storage', 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('다른 다이어리 창을 닫은 뒤 다시 시도해 주세요.'));
    });
    disk = await read('readwrite', (rows, store) => {
      for (let i = 0; i < legacy.length; i++) {
        const key = legacy.key(i);
        if (!isDiaryKey(key) || rows.has(key)) continue;
        const value = legacy.getItem(key);
        if (value === null) continue;
        store.put({ key, value }); rows.set(key, value);
      }
      return rows;
    });
  }
  async function refresh() {
    if (drafts.size || active) return false;
    const before = generation;
    const next = await read('readonly', rows => rows);
    if (drafts.size || active || before !== generation) return false;
    const changed = next.size !== disk.size || [...next].some(([key, value]) => disk.get(key) !== value);
    disk = next;
    if (changed) generation++;
    if (changed) onRefresh();
    return changed;
  }
  async function drain() {
    while (drafts.size) {
      const batch = new Map(drafts);
      const next = await read('readwrite', (rows, store) => {
        const skipped = new Set();
        for (const [key, { value, patch, staleAcknowledgement }] of batch) {
          if (!patch && rows.get(key) !== disk.get(key) && rows.get(key) !== value) {
            if (staleAcknowledgement && batch.size === 1) { skipped.add(key); continue; }
            throw Object.assign(new Error('다른 창에서 기록이 바뀌었어요. 이 창에서 전체 백업을 저장한 뒤 다시 열어 주세요.'), { name: 'DiaryWriteConflict' });
          }
        }
        for (const [key, { value, patch }] of batch) {
          if (skipped.has(key)) continue;
          const committed = patch
            ? JSON.stringify({ ...JSON.parse(rows.get(key) || '{}'), ...patch }) : value;
          store.put({ key, value: committed }); rows.set(key, committed);
        }
        return rows;
      });
      const otherChanged = [...next].some(([key, value]) => !batch.has(key) && disk.get(key) !== value);
      // Keep the expected values for keys edited while the transaction was running.
      for (const key of drafts.keys()) if (!batch.has(key)) {
        if (disk.has(key)) next.set(key, disk.get(key)); else next.delete(key);
      }
      disk = next;
      generation++;
      for (const [key, value] of batch) if (drafts.get(key) === value) drafts.delete(key);
      if (otherChanged) onRefresh();
      onCommit();
    }
  }
  function flush() {
    if (!active && !drafts.size) return Promise.resolve();
    if (!active) active = drain().then(() => { error = undefined; }, failure => {
      error = failure; throw failure;
    }).finally(() => { active = undefined; onStatus(); });
    return active.then(() => { if (drafts.size) return flush(); });
  }
  function setItem(key, value, patch, staleAcknowledgement = false) {
    if (!isDiaryKey(key)) throw new Error('지원하지 않는 다이어리 저장 항목입니다.');
    if (getItem(key) === value) return;
    const prior = drafts.get(key);
    drafts.set(key, { value,
      patch: patch && (!prior || prior.patch || prior.staleAcknowledgement) ? { ...prior?.patch, ...patch } : undefined,
      staleAcknowledgement: staleAcknowledgement && (!prior || prior.staleAcknowledgement || Boolean(prior.patch))
    });
    queueMicrotask(() => { void flush().catch(() => {}); });
  }
  function getItem(key) { return drafts.get(key)?.value ?? disk.get(key) ?? null; }
  return { open, flush, refresh, status, setItem, getItem };
}

let browserStore;
const emit = name => window.dispatchEvent(new Event(name));
export const diaryStorage = {
  getItem: key => browserStore.getItem(key),
  setItem(key, value, patch, staleAcknowledgement) {
    browserStore.setItem(key, value, patch, staleAcknowledgement);
    emit('clover-sync-status');
  }
};
export const getDiaryStorageStatus = () => browserStore?.status() || {};
export const flushDiaryStorage = () => browserStore.flush();
export async function refreshDiaryStorage() { await browserStore.flush(); await browserStore.refresh(); }
export async function initializeDiaryStorage() {
  if (browserStore) return;
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('clover-diary-storage') : null;
  const store = createDiaryStorage({ indexedDB, legacy: localStorage,
    onStatus: () => emit('clover-sync-status'),
    onCommit: () => channel?.postMessage('updated'),
    onRefresh: () => { emit('clover-data-change'); emit('clover-sync-status'); }
  });
  await store.open();
  browserStore = store;
  if (channel) channel.onmessage = () => { void store.refresh().catch(() => {}); };
  window.addEventListener('beforeunload', event => {
    if (!store.status().pending) return;
    event.preventDefault(); event.returnValue = '';
  });
}

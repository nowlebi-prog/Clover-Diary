import { useEffect, useState } from 'react';
import { getCloudSyncStatus, syncAllDataFromCloud } from '../../lib/storage/cloudSync';

export function describeSyncStatus(status) {
  if (!status.enabled) return '이 브라우저에만 저장됨 · 기기 간 동기화 꺼짐';
  if (!status.authenticated) return '동기화하려면 계정 로그인이 필요해요';
  if (status.offline) return '오프라인 · 기기에 보관 중, 연결되면 자동 전송';
  if (status.lastSyncStatus === 'error') return '서버 저장 실패 · 기기에 보관 중, 자동 재시도';
  if (status.lastSyncStatus === 'syncing') return '동기화 중 · 기기에 저장됨';
  if (status.pending) return '기기에 저장됨 · 서버 전송 대기';
  if (status.lastSyncStatus === 'saved') return '서버 저장 완료';
  return '서버 연결 확인 중';
}
export default function SyncStatus() {
  const [status, setStatus] = useState(getCloudSyncStatus);
  useEffect(() => {
    const refresh = () => setStatus(getCloudSyncStatus());
    const events = ['clover-sync-status', 'online', 'offline'];
    events.forEach(name => window.addEventListener(name, refresh));
    refresh();
    return () => events.forEach(name => window.removeEventListener(name, refresh));
  }, []);
  return <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/60 px-4 py-2 text-xs text-clover-sub">
    <span role="status" aria-live="polite">{describeSyncStatus(status)}</span>
    {status.enabled && <button type="button" className="font-bold text-clover-deep" disabled={status.lastSyncStatus === 'syncing'} onClick={() => void syncAllDataFromCloud()}>다시 동기화</button>}
  </div>;
}

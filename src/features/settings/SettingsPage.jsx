import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { logout, usingCloud } from "../../lib/auth/authAdapter";
import { describeSyncStatus } from "../../components/common/SyncStatus";
import { base64ToBlob, buildMonthlyArchivePackage, downloadBlob } from "../../lib/utils/monthlyArchive";
import {
  getAllData,
  buildFullBackup,
  getLegacyData,
  importLegacyData,
  getCloudSyncStatus,
  getDeletedItems,
  resetAllData,
  restoreDeletedItem,
  saveAllData,
  syncAllDataFromCloud
} from "../../lib/storage/localStorageAdapter";
import {
  backupToGoogleSheets,
  getGoogleSheetsBackupConfig,
  saveGoogleSheetsBackupConfig
} from "../../lib/storage/googleSheetsBackup";
import { toDateKey } from "../../lib/utils/date";

const moreLinks = [
  ["/", "Home"],
  ["/life", "Life"],
  ["/work", "Work"],
  ["/money", "Money"],
  ["/archive", "Archive"],
  ["/tasks", "Tasks"],
  ["/calendar", "Calendar"],
  ["/journal", "Journal"],
  ["/settings", "Settings"]
];

const previousMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const titleOf = (item) => item?.title || item?.name || item?.project || item?.body || item?.text || item?.memo || item?.id || "삭제된 항목";
const collectionLabel = {
  todos: "할 일",
  events: "일정",
  quotes: "좋은 말",
  ideas: "아이디어",
  inboxMemos: "메모",
  payments: "입금",
  expenses: "지출",
  habits: "루틴",
  reflections: "회고"
};

function MonthlyArchiveSettings() {
  const [data, setData] = useState(getAllData());
  const [month, setMonth] = useState(previousMonth());
  const [busy, setBusy] = useState(false);
  const archives = data.monthlyArchives || [];

  const refresh = () => setData(getAllData());

  const saveArchive = async () => {
    setBusy(true);
    const pack = await buildMonthlyArchivePackage(getAllData(), month);
    const next = getAllData();
    next.monthlyArchives = [
      {
        id: `monthly-${month}`,
        month,
        filename: pack.filename,
        size: pack.zip.size,
        dataBase64: pack.base64,
        summary: pack.summary,
        createdAt: toDateKey(new Date()),
        updatedAt: toDateKey(new Date())
      },
      ...(next.monthlyArchives || []).filter((entry) => entry.month !== month)
    ];
    saveAllData(next);
    setBusy(false);
    refresh();
  };

  const downloadArchive = (archive) => {
    downloadBlob(base64ToBlob(archive.dataBase64), archive.filename || `clover-desk-${archive.month}.zip`);
  };

  return (
    <GlassCard>
      <SectionTitle>월별 기록</SectionTitle>
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <label className="grid gap-1 text-sm font-bold">
          월 선택
          <AppInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <AppButton variant="soft" onClick={saveArchive} disabled={busy}>{busy ? "저장 중..." : "월별 ZIP 저장"}</AppButton>
        </div>
      </div>
      <p className="mt-3 text-sm font-bold text-clover-sub">PDF는 아카이브 화면 우측 상단에서 바로 받을 수 있고, 여기는 월별 ZIP 기록을 보관하는 곳이에요.</p>

      <div className="mt-4 grid gap-2">
        {archives.map((archive) => (
          <article key={archive.id || archive.month} className="rounded-[8px] bg-white/55 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black">{archive.month} 기록</p>
                <p className="mt-1 text-xs font-bold text-clover-sub">
                  {archive.filename} · {Math.round(Number(archive.size || 0) / 1024)}KB
                </p>
              </div>
              <AppButton variant="soft" onClick={() => downloadArchive(archive)}>ZIP 다운로드</AppButton>
            </div>
            {archive.summary && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-clover-sub md:grid-cols-4">
                <span>완료 {archive.summary.completedTodos}/{archive.summary.totalTodos}</span>
                <span>기분 {archive.summary.moodAvg}점</span>
                <span>수면 {archive.summary.sleepAvg}h</span>
                <span>기록 {archive.summary.journalCount}개</span>
              </div>
            )}
          </article>
        ))}
        {!archives.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 저장된 월별 ZIP 기록이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function TrashSettings() {
  const [items, setItems] = useState(getDeletedItems());

  useEffect(() => {
    const refresh = () => setItems(getDeletedItems());
    window.addEventListener("clover-data-change", refresh);
    return () => window.removeEventListener("clover-data-change", refresh);
  }, []);

  const restore = (id) => {
    restoreDeletedItem(id);
    setItems(getDeletedItems());
  };

  return (
    <GlassCard>
      <SectionTitle>삭제 복구</SectionTitle>
      <p className="mb-3 text-sm font-bold text-clover-sub">삭제한 항목은 7일 동안 여기에서 되돌릴 수 있어요.</p>
      <div className="grid gap-2">
        {items.slice(0, 12).map((entry) => (
          <article key={entry.id} className="grid gap-2 rounded-[8px] bg-white/55 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{titleOf(entry.item)}</p>
              <p className="mt-1 text-xs font-bold text-clover-sub">
                {collectionLabel[entry.collection] || entry.collection} · {new Date(entry.deletedAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <AppButton variant="soft" onClick={() => restore(entry.id)}>되돌리기</AppButton>
          </article>
        ))}
        {!items.length && <p className="rounded-[8px] bg-white/45 p-4 text-sm font-bold text-clover-sub">복구할 삭제 항목이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function GoogleSheetsBackupSettings() {
  const [config, setConfig] = useState(getGoogleSheetsBackupConfig());
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const next = getGoogleSheetsBackupConfig();
      setConfig(next);
      setWebhookUrl(next.webhookUrl || "");
    };
    window.addEventListener("clover-backup-change", refresh);
    return () => window.removeEventListener("clover-backup-change", refresh);
  }, []);

  const save = (updates = {}) => {
    const next = saveGoogleSheetsBackupConfig({ webhookUrl: webhookUrl.trim(), ...updates });
    setConfig(next);
  };

  const backupNow = async () => {
    save();
    setBusy(true);
    await backupToGoogleSheets({ manual: true });
    setConfig(getGoogleSheetsBackupConfig());
    setBusy(false);
  };

  return (
    <GlassCard>
      <SectionTitle>Google Sheets 자동 백업</SectionTitle>
      <div className="grid gap-3 text-sm text-clover-sub">
        <p>
          앱이 켜져 있으면 하루 1회 이상 Google Sheets로 최신 데이터를 백업해요.
          기록은 앱 안에 저장되고, 시트에는 복구용 원본 데이터와 항목별 탭이 같이 쌓입니다.
        </p>
        <label className="grid gap-1 font-bold text-clover-text">
          Apps Script 웹앱 URL
          <AppInput
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <AppButton variant={config.enabled ? "primary" : "soft"} onClick={() => save({ enabled: !config.enabled })}>
            {config.enabled ? "자동 백업 켜짐" : "자동 백업 켜기"}
          </AppButton>
          <AppButton variant="soft" onClick={save}>URL 저장</AppButton>
          <AppButton variant="soft" onClick={backupNow} disabled={busy || !webhookUrl.trim()}>
            {busy ? "백업 중..." : "지금 백업"}
          </AppButton>
        </div>
        <div className="grid gap-1 rounded-[8px] bg-white/45 p-3 text-xs font-bold">
          <span>상태: {config.lastStatus || "idle"}</span>
          {config.lastBackupAt && <span>마지막 백업: {new Date(config.lastBackupAt).toLocaleString("ko-KR")}</span>}
          {config.lastError && <span className="text-red-500">오류: {config.lastError}</span>}
        </div>
        <p className="text-xs font-bold text-clover-sub">
          단, 브라우저 앱이라 컴퓨터나 앱이 완전히 꺼져 있으면 그 순간에는 실행되지 않아요.
          앱을 다시 열면 누락된 날짜의 최신 스냅샷을 바로 올립니다.
        </p>
      </div>
    </GlassCard>
  );
}

export default function SettingsPage({ onLogout }) {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState(getCloudSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState("");
  const [legacyAvailable, setLegacyAvailable] = useState(() => {
    try { return usingCloud && Boolean(getLegacyData()); } catch { return false; }
  });

  useEffect(() => {
    const refresh = () => setSyncStatus(getCloudSyncStatus());
    refresh();
    window.addEventListener("clover-data-change", refresh);
    window.addEventListener("clover-sync-status", refresh);
    const timer = window.setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("clover-data-change", refresh);
      window.removeEventListener("clover-sync-status", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const signOut = async () => {
    sessionStorage.removeItem("clover-money-unlocked");
    try { await logout(); onLogout(null); navigate("/login"); }
    catch (error) { setNotice(`로그아웃하지 못했어요: ${error.message}`); }
  };

  const downloadBackup = () => {
    try {
      downloadBlob(new Blob([JSON.stringify(buildFullBackup(), null, 2)], { type: "application/json" }), `clover-backup-${toDateKey(new Date())}.json`);
      setNotice("전체 기록과 복구 사본을 백업 파일로 내보냈어요.");
    } catch (error) { setNotice(`백업하지 못했어요: ${error.message}`); }
  };
  const importOldRecords = () => {
    if (!confirm("이 기기의 기존 기록을 현재 로그인한 계정에 합칠까요? 기존 원본은 그대로 보존됩니다.")) return;
    try {
      importLegacyData(); setLegacyAvailable(false);
      setNotice("기존 기록을 합쳤어요. 서버 저장 상태를 확인해 주세요.");
    } catch (error) { setNotice(`가져오지 못했어요: ${error.message}`); }
  };

  const reset = () => {
    if (confirm("저장된 데이터를 처음 상태로 되돌릴까요?")) resetAllData();
  };

  const syncNow = async () => {
    setSyncing(true);
    await syncAllDataFromCloud();
    setSyncStatus(getCloudSyncStatus());
    setSyncing(false);
  };

  return (
    <>
      <PageHeader eyebrow="Settings" title="설정" />
      <div className="grid gap-4">
        {notice && <p role="status" className="rounded-2xl bg-white/70 p-4 text-sm">{notice}</p>}
        <GlassCard className="md:hidden">
          <SectionTitle>전체 메뉴</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map(([to, label]) => <Link key={to} to={to} className="rounded-full bg-white/55 px-4 py-3 text-center text-sm font-bold text-clover-deep">{label}</Link>)}
          </div>
        </GlassCard>

        <MonthlyArchiveSettings />
        <GoogleSheetsBackupSettings />
        <TrashSettings />

        <GlassCard>
          <SectionTitle>아이폰 홈 화면 위젯</SectionTitle>
          <p className="text-sm text-clover-sub">Scriptable을 이용해 주간 날짜와 오늘 일정·할 일을 홈 화면에서 볼 수 있어요. 같은 다이어리 계정으로 연결해 주세요.</p>
          <a href="/iphone-widget.html" className="mt-4 inline-block rounded-full bg-clover-deep px-5 py-3 text-sm font-bold text-white">위젯 설치 안내 열기</a>
          <p className="mt-3 text-xs text-clover-sub">갱신 시점은 iOS가 결정하며, 내용을 누르면 다이어리가 열려요.</p>
        </GlassCard>

        <GlassCard>
          <SectionTitle>Supabase 동기화</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={syncStatus.lastSyncStatus === "saved" ? "mint" : "cream"}>{describeSyncStatus(syncStatus)}</StatusBadge>
            </div>
            <p>모든 기기에서 같은 Supabase 계정으로 로그인해 주세요. 연결되면 변경 기록을 자동으로 합치고, 전송 실패 시 기기에 보관했다가 다시 전송해요.</p>
            {syncStatus.lastRemoteUpdatedAt && <p>마지막 원격 업데이트: {new Date(syncStatus.lastRemoteUpdatedAt).toLocaleString()}</p>}
            {syncStatus.lastLocalWriteAt && <p>마지막 로컬 저장: {new Date(syncStatus.lastLocalWriteAt).toLocaleString()}</p>}
            {syncStatus.lastSyncedAt && <p>마지막 서버 확인: {new Date(syncStatus.lastSyncedAt).toLocaleString()}</p>}
            {Boolean(syncStatus.conflicts?.length) && <p>동시 수정 {syncStatus.conflicts.length}건의 양쪽 내용을 복구 사본에 보관했어요. 전체 백업으로 내려받을 수 있습니다.</p>}
            {syncStatus.lastSyncError && <p className="font-bold text-red-500">오류: {syncStatus.lastSyncError}</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={syncNow} disabled={syncing}>{syncing ? "동기화 중..." : "지금 동기화"}</AppButton>
            <AppButton variant="soft" onClick={downloadBackup}>전체 기록·복구 사본 백업</AppButton>
            {legacyAvailable && <AppButton variant="soft" onClick={importOldRecords}>이 기기의 기존 기록 가져오기</AppButton>}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>앱 정보</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <p><b className="text-clover-text">Clover Desk</b>는 일상, 업무, 돈관리, 기록을 한곳에서 보는 개인 생산성 PWA예요.</p>
            <p>Supabase 연결과 계정 로그인이 모두 준비되면 기기 간 동기화됩니다. 환경변수가 없으면 이 브라우저에만 저장됩니다.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>PWA Ready</StatusBadge>
            <StatusBadge tone="lavender">Supabase Sync Ready</StatusBadge>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>관리</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={reset}>데이터 초기화</AppButton>
            <AppButton variant="danger" onClick={signOut}>로그아웃</AppButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

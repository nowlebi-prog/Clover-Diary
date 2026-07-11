import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { logout } from "../../lib/auth/localAuthAdapter";
import { getCloudSyncStatus, resetAllData, syncAllDataFromCloud } from "../../lib/storage/localStorageAdapter";

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

export default function SettingsPage({ onLogout }) {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState(getCloudSyncStatus());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refresh = () => setSyncStatus(getCloudSyncStatus());
    refresh();
    window.addEventListener("clover-data-change", refresh);
    const timer = window.setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("clover-data-change", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const signOut = () => {
    sessionStorage.removeItem("clover-money-unlocked");
    logout();
    onLogout(null);
    navigate("/login");
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
        <GlassCard className="md:hidden">
          <SectionTitle>전체 메뉴</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map(([to, label]) => <Link key={to} to={to} className="rounded-full bg-white/55 px-4 py-3 text-center text-sm font-bold text-clover-deep">{label}</Link>)}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>Supabase 동기화</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={syncStatus.enabled ? "mint" : "cream"}>{syncStatus.enabled ? "Supabase 연결됨" : "환경변수 필요"}</StatusBadge>
              <StatusBadge tone={syncStatus.lastSyncStatus === "error" ? "danger" : "blue"}>{syncStatus.lastSyncStatus || "대기 중"}</StatusBadge>
            </div>
            <p>PC와 모바일이 같은 Supabase snapshot을 주기적으로 확인해요. 저장하면 자동으로 올리고, 다른 기기 변경은 몇 초 안에 가져옵니다.</p>
            {syncStatus.lastRemoteUpdatedAt && <p>마지막 원격 업데이트: {new Date(syncStatus.lastRemoteUpdatedAt).toLocaleString()}</p>}
            {syncStatus.lastLocalWriteAt && <p>마지막 로컬 저장: {new Date(syncStatus.lastLocalWriteAt).toLocaleString()}</p>}
            {syncStatus.lastSyncError && <p className="font-bold text-red-500">오류: {syncStatus.lastSyncError}</p>}
          </div>
          <div className="mt-4">
            <AppButton variant="soft" onClick={syncNow} disabled={syncing}>{syncing ? "동기화 중..." : "지금 동기화"}</AppButton>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>앱 정보</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <p><b className="text-clover-text">Clover Desk</b>는 일상, 업무, 돈관리, 기록을 한 곳에서 보는 개인 생산성 PWA예요.</p>
            <p>Supabase 환경변수가 없으면 현재 브라우저에만 저장되고, 환경변수가 있으면 서버 snapshot과 동기화됩니다.</p>
            <p>Vercel 배포 설정은 Vite preset, build command `pnpm run build`, output directory `dist`를 쓰면 됩니다.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>PWA Ready</StatusBadge>
            <StatusBadge tone="blue">Vercel Ready</StatusBadge>
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

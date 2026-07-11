import { Link, useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { logout, usingCloud } from "../../lib/auth/authAdapter";
import { stopCloudSync, forcePushNow } from "../../lib/storage/cloudSync";
import { resetAllData } from "../../lib/storage/localStorageAdapter";

const moreLinks = [
  ["/", "홈"],
  ["/work", "워크"],
  ["/tasks", "할 일"],
  ["/life", "라이프"],
  ["/archive", "아카이브"],
  ["/habits", "습관"],
  ["/money", "머니"],
  ["/campaigns", "프로젝트"],
  ["/files", "파일"],
  ["/settings", "설정"]
];

export default function SettingsPage({ onLogout }) {
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    stopCloudSync();
    onLogout(null);
    navigate("/login");
  };
  const reset = () => {
    if (confirm("샘플 데이터로 초기화할까요? 지금까지 입력한 내용은 사라져요.")) resetAllData();
  };

  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="설정" />
      <div className="grid gap-4">
        <GlassCard className="md:hidden">
          <SectionTitle>전체 메뉴</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map(([to, label]) => <Link key={to} to={to} className="rounded-full bg-white/55 px-4 py-3 text-center text-sm font-bold text-clover-deep">{label}</Link>)}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>데이터 동기화 상태</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {usingCloud ? (
              <>
                <StatusBadge tone="done">클라우드 동기화 중</StatusBadge>
                <StatusBadge tone="blue">기기 간 자동 동기화</StatusBadge>
              </>
            ) : (
              <StatusBadge tone="warning">이 브라우저에만 저장됨</StatusBadge>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-clover-sub">
            {usingCloud
              ? "로그인한 계정 기준으로 Supabase에 안전하게 저장돼요. 다른 기기에서 같은 계정으로 로그인하면 데이터가 그대로 보여요."
              : "아직 클라우드 연결 전이라 이 브라우저(또는 이 PWA 아이콘)에만 데이터가 남아요. 다른 브라우저·다른 기기에서는 안 보일 수 있어요."}
          </p>
          {usingCloud && (
            <AppButton className="mt-3" variant="soft" onClick={() => forcePushNow()}>지금 바로 동기화</AppButton>
          )}
        </GlassCard>

        <GlassCard>
          <SectionTitle>앱 정보</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <p><b className="text-clover-text">Clover Desk</b>는 설치 가능한 개인용 PWA예요.</p>
            <p>Vercel 배포 기준: Vite 프리셋, 빌드 명령 <code>pnpm run build</code>, 출력 디렉토리 <code>dist</code>.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>PWA Ready</StatusBadge>
            <StatusBadge tone="blue">Vercel Ready</StatusBadge>
            <StatusBadge tone="lavender">{usingCloud ? "Supabase Connected" : "Supabase Adapter Ready"}</StatusBadge>
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

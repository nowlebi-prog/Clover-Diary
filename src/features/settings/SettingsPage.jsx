import { Link, useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { logout } from "../../lib/auth/localAuthAdapter";
import { resetAllData } from "../../lib/storage/localStorageAdapter";

const moreLinks = [
  ["/life", "Life"], ["/money", "Money"], ["/archive", "Archive"], ["/campaigns", "Campaigns"], ["/files", "Files"]
];

export default function SettingsPage({ onLogout }) {
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    onLogout(null);
    navigate("/login");
  };
  const reset = () => {
    if (confirm("샘플 데이터로 초기화할까요?")) resetAllData();
  };

  return (
    <>
      <PageHeader eyebrow="Settings" title="설정과 More" />
      <div className="grid gap-4">
        <GlassCard className="md:hidden">
          <SectionTitle>More</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map(([to, label]) => <Link key={to} to={to} className="rounded-full bg-white/55 px-4 py-3 text-center text-sm font-bold text-clover-deep">{label}</Link>)}
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>앱 정보</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <p><b className="text-clover-text">Clover Desk</b>는 브라우저에서 설치 가능한 PWA입니다.</p>
            <p>데이터는 현재 이 브라우저의 localStorage에 저장됩니다.</p>
            <p>Vercel 배포는 Vite 기본값 그대로 `npm run build` 후 `dist`를 사용하면 됩니다.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>PWA Ready</StatusBadge>
            <StatusBadge tone="blue">Vercel Ready</StatusBadge>
            <StatusBadge tone="lavender">Supabase Adapter Ready</StatusBadge>
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>Supabase 전환 메모</SectionTitle>
          <p className="text-sm leading-relaxed text-clover-sub">
            UI는 `src/lib/storage/localStorageAdapter.js`와 `src/lib/auth/localAuthAdapter.js`만 호출합니다.
            나중에 Supabase로 옮길 때는 동일한 메서드 이름을 가진 `supabaseStorageAdapter.js`,
            `supabaseAuthAdapter.js`를 만들고 import 경로만 바꾸면 됩니다. 테이블은 users, todos,
            top3, delayed_tasks, habits, habit_logs, events, timeline_entries, chores, shopping_items,
            supplies, expenses, subscriptions, payments, reflections, quotes, ideas, links, inbox_memos,
            content_plans, campaigns, campaign_participants, important_files 구조를 권장합니다.
          </p>
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

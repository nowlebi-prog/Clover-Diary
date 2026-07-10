import { Link, useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import { logout } from "../../lib/auth/localAuthAdapter";
import { resetAllData } from "../../lib/storage/localStorageAdapter";

const moreLinks = [
  ["/", "Today"],
  ["/plan", "Planner"],
  ["/tasks", "Tasks"],
  ["/life", "Life"],
  ["/archive", "Archive"],
  ["/habits", "Habits"],
  ["/money", "Money"],
  ["/campaigns", "Campaigns"],
  ["/files", "Files"],
  ["/settings", "Settings"]
];

export default function SettingsPage({ onLogout }) {
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    onLogout(null);
    navigate("/login");
  };
  const reset = () => {
    if (confirm("Reset data to the sample set?")) resetAllData();
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
          <SectionTitle>App info</SectionTitle>
          <div className="grid gap-3 text-sm text-clover-sub">
            <p><b className="text-clover-text">Clover Desk</b> is a browser-installable PWA.</p>
            <p>Data is stored in this browser through localStorage.</p>
            <p>For Vercel, use the Vite preset, build command `npm run build`, and output directory `dist`.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge>PWA Ready</StatusBadge>
            <StatusBadge tone="blue">Vercel Ready</StatusBadge>
            <StatusBadge tone="lavender">Supabase Adapter Ready</StatusBadge>
          </div>
        </GlassCard>
        <GlassCard>
          <SectionTitle>Supabase migration note</SectionTitle>
          <p className="text-sm leading-relaxed text-clover-sub">
            UI code talks to adapters under `src/lib/storage` and `src/lib/auth`. For habits, keep the same method names
            and map `habits` plus `habit_logs` to Supabase tables with `user_id`, `habit_id`, `date`, and `completed`.
          </p>
        </GlassCard>
        <GlassCard>
          <SectionTitle>Manage</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={reset}>Reset data</AppButton>
            <AppButton variant="danger" onClick={signOut}>Log out</AppButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

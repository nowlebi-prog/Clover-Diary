import GlassCard from "../common/GlassCard";
import StatusBadge from "../common/StatusBadge";
import SectionLink from "./SectionLink";

export default function DeadlineProjectsCard({ projects = [] }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-clover-deep">Deadline</p>
          <h2 className="text-base font-black">마감임박 프로젝트</h2>
        </div>
        <SectionLink to="/campaigns" />
      </div>
      <div className="grid gap-2">
        {projects.map((project) => (
          <article key={project.id} className="rounded-2xl bg-white/55 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-bold">{project.name}</p>
              <StatusBadge tone={project.dday <= 1 ? "danger" : project.dday <= 3 ? "warning" : "cream"}>
                {project.dday === 0 ? "D-Day" : project.dday > 0 ? `D-${project.dday}` : `D+${Math.abs(project.dday)}`}
              </StatusBadge>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/70">
              <div className="h-1.5 rounded-full bg-clover-primary" style={{ width: `${project.progress}%` }} />
            </div>
            <p className="mt-2 text-[11px] font-bold text-clover-sub">다음 액션 · {project.nextAction}</p>
          </article>
        ))}
        {!projects.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">마감이 임박한 프로젝트가 없어요.</p>}
      </div>
    </GlassCard>
  );
}

import GlassCard from "../common/GlassCard";
import StatusBadge from "../common/StatusBadge";
import SectionLink from "./SectionLink";

export default function ProjectsProgressCard({ projects = [] }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-clover-deep">Projects</p>
          <h2 className="text-base font-black">프로젝트 진행률</h2>
        </div>
        <SectionLink to="/campaigns" />
      </div>
      <div className="grid gap-2">
        {projects.map((project) => (
          <article key={project.id} className="rounded-2xl bg-white/55 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold">{project.name}</p>
              <StatusBadge tone="lavender">{project.status}</StatusBadge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-white/70">
                <div className="h-1.5 rounded-full bg-clover-deep" style={{ width: `${project.progress}%` }} />
              </div>
              <span className="text-[11px] font-black text-clover-sub">{project.progress}%</span>
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-clover-sub">
              {project.dueDate ? `마감 ${project.dueDate.slice(5)}` : "마감 미정"} · {project.nextAction}
            </p>
          </article>
        ))}
        {!projects.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">진행 중인 프로젝트가 없어요.</p>}
      </div>
    </GlassCard>
  );
}

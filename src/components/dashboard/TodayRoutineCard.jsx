import CustomCheckbox from "../common/CustomCheckbox";
import GlassCard from "../common/GlassCard";
import SectionLink from "./SectionLink";

export default function TodayRoutineCard({ routines, onToggle }) {
  const { items, doneCount, total, rate } = routines;
  return (
    <GlassCard className="bg-emerald-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Routine</p>
          <h2 className="text-base font-black">오늘 루틴</h2>
        </div>
        <SectionLink to="/habits" />
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-white/70">
          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
        </div>
        <span className="shrink-0 text-xs font-black text-emerald-700">{doneCount}/{total}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white/65 px-3 py-2.5">
            <CustomCheckbox checked={item.completed} label={item.name} onChange={() => onToggle(item.id)} />
            {item.streak > 0 && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
                🔥{item.streak}
              </span>
            )}
          </article>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub sm:col-span-2">오늘 예정된 루틴이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

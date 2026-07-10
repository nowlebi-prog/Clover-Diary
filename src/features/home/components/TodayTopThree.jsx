import CustomCheckbox from "../../../components/common/CustomCheckbox";
import SectionLink from "../../../components/dashboard/SectionLink";

const ACCENTS = [
  { bg: "bg-clover-coral/60", ring: "border-clover-coral", badge: "bg-clover-coralDeep text-white" },
  { bg: "bg-clover-mint/60", ring: "border-clover-primary/50", badge: "bg-clover-deep text-white" },
  { bg: "bg-clover-cream", ring: "border-amber-200", badge: "bg-amber-400 text-white" }
];

export default function TodayTopThree({ items = [] }) {
  const topItems = items.slice(0, 3);

  return (
    <section className="glass rounded-[24px] bg-white/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-clover-coralDeep">Today's Mission</p>
          <h2 className="text-base font-black">오늘 꼭 해야 할 일 TOP 3</h2>
        </div>
        <SectionLink to="/tasks" />
      </div>

      <div className="grid gap-2">
        {topItems.map((item, index) => {
          const accent = ACCENTS[index] || ACCENTS[2];
          return (
            <article
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${accent.ring} ${
                item.completed ? "opacity-55 bg-white/60" : accent.bg
              }`}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${accent.badge}`}>
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <CustomCheckbox checked={item.completed} label={item.title} onChange={(checked) => item.onToggle(checked)} />
                {(item.project || item.dueDate) && (
                  <p className="mt-0.5 truncate pl-7 text-[11px] font-bold text-clover-sub">
                    {item.project ? item.project : ""}
                    {item.project && item.dueDate ? " · " : ""}
                    {item.dueDate ? `~${item.dueDate.slice(5)}` : ""}
                  </p>
                )}
              </div>
            </article>
          );
        })}
        {!topItems.length && (
          <div className="rounded-2xl bg-white/55 p-3 text-sm text-clover-sub">
            오늘 꼭 끝낼 일 3개를 Tasks에서 정해보세요.
          </div>
        )}
      </div>
    </section>
  );
}

import CustomCheckbox from "../../../components/common/CustomCheckbox";
import SectionLink from "../../../components/dashboard/SectionLink";

export default function TodayTopThree({ items = [] }) {
  const topItems = items.slice(0, 3);

  return (
    <section className="glass rounded-[28px] bg-gradient-to-br from-[#FFF8EA]/90 to-[#E9F8EF]/80 p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-clover-text">오늘 반드시 할 TOP 3</h2>
        <SectionLink to="/tasks" />
      </div>
      <p className="mb-4 text-sm text-clover-sub">오늘은 이 세 가지만 끝내도 충분해요.</p>
      <div className="grid gap-2">
        {topItems.map((item, index) => (
          <article
            key={item.id}
            className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 transition ${
              item.completed ? "border-clover-primary/30 bg-white/45 opacity-70" : "border-white/80 bg-white/70"
            }`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clover-deep text-xs font-black text-white">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <CustomCheckbox checked={item.completed} label={item.title} onChange={(checked) => item.onToggle(checked)} />
              {(item.dueDate || item.category) && (
                <p className="mt-0.5 pl-9 text-[11px] font-bold text-clover-sub">
                  {item.category || "업무"}{item.dueDate ? ` · ~${item.dueDate.slice(5)}` : ""}
                </p>
              )}
            </div>
          </article>
        ))}
        {!topItems.length && (
          <div className="rounded-[20px] bg-white/55 p-4 text-sm text-clover-sub">
            오늘 꼭 끝낼 일 3개를 Tasks에서 정해보세요.
          </div>
        )}
      </div>
    </section>
  );
}

import { daysBetween } from "../../lib/utils/date";
import StatusBadge from "../common/StatusBadge";

export default function DeadlineList({ items, today }) {
  return (
    <div className="grid gap-1.5">
      {items.map((item, index) => {
        const dday = daysBetween(today, item.date);
        const tone = dday < 0 ? "danger" : dday <= 3 ? "warning" : "cream";
        const label = dday < 0 ? `D+${Math.abs(dday)}` : dday === 0 ? "Today" : `D-${dday}`;
        return (
          <article key={`${item.type}-${item.id || index}`} className="flex items-center justify-between gap-3 rounded-[18px] bg-white/45 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{item.displayTitle}</p>
              <p className="text-[11px] text-clover-sub">{item.label} · {item.date}</p>
            </div>
            <StatusBadge tone={tone}>{label}</StatusBadge>
          </article>
        );
      })}
      {!items.length && <p className="rounded-[18px] bg-white/35 p-3 text-sm text-clover-sub">가까운 마감은 없어요.</p>}
    </div>
  );
}

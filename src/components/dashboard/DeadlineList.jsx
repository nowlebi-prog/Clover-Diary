import { daysBetween } from "../../lib/utils/date";
import StatusBadge from "../common/StatusBadge";

export default function DeadlineList({ items, today }) {
  return (
    <div className="grid gap-2">
      {items.map((item, index) => {
        const dday = daysBetween(today, item.date);
        const tone = dday < 0 ? "danger" : dday <= 3 ? "warning" : "cream";
        const label = dday < 0 ? `D+${Math.abs(dday)}` : dday === 0 ? "Today" : `D-${dday}`;
        return (
          <article key={`${item.type}-${item.id || index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{item.displayTitle}</p>
              <p className="text-xs text-clover-sub">{item.label} · {item.date}</p>
            </div>
            <StatusBadge tone={tone}>{label}</StatusBadge>
          </article>
        );
      })}
      {!items.length && <p className="text-sm text-clover-sub">No urgent deadlines.</p>}
    </div>
  );
}

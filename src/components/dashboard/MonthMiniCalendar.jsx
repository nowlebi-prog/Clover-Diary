import { useState } from "react";
import AppButton from "../common/AppButton";
import GlassCard from "../common/GlassCard";
import SectionTitle from "../common/SectionTitle";
import { formatMonth, monthMatrix, toDateKey } from "../../lib/utils/date";
import { getMonthCalendarItems } from "../../lib/utils/dashboardSelectors";

const dotColor = { event: "#3E8F63", todo: "#F87171", content: "#6AA9FF", payment: "#F87171", campaign: "#8DDFA8", subscription: "#FBBF24" };

export default function MonthMiniCalendar({ data }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(toDateKey(now));
  const itemsByDate = getMonthCalendarItems(data, cursor.year, cursor.month);
  const selectedItems = itemsByDate[selected] || [];
  const move = (amount) => {
    const date = new Date(cursor.year, cursor.month + amount, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

  return (
    <GlassCard>
      <SectionTitle action={<AppButton variant="soft" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>Today</AppButton>}>
        This month
      </SectionTitle>
      <div className="mb-3 flex items-center justify-between">
        <button className="rounded-full bg-white/55 px-3 py-2 text-sm font-bold text-clover-sub" onClick={() => move(-1)}>Prev</button>
        <p className="font-bold">{formatMonth(cursor.year, cursor.month)}</p>
        <button className="rounded-full bg-white/55 px-3 py-2 text-sm font-bold text-clover-sub" onClick={() => move(1)}>Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-clover-sub">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {monthMatrix(cursor.year, cursor.month).map((cell) => {
          const items = itemsByDate[cell.date] || [];
          return (
            <button
              key={cell.date}
              onClick={() => setSelected(cell.date)}
              className={`min-h-12 rounded-2xl p-1 text-left text-xs transition ${cell.inMonth ? "bg-white/45" : "bg-white/20 text-clover-sub/50"} ${cell.isToday ? "ring-2 ring-clover-deep" : ""} ${selected === cell.date ? "bg-clover-mint/60" : ""}`}
            >
              <span className="font-bold">{cell.day}</span>
              <span className="mt-1 flex flex-wrap gap-0.5">
                {items.slice(0, 3).map((item, index) => <i key={`${item.type}-${index}`} className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[item.type] || "#7A887F" }} />)}
                {items.length > 3 && <em className="text-[9px] not-italic text-clover-sub">+{items.length - 3}</em>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[22px] bg-white/45 p-3">
        <p className="mb-2 text-xs font-bold text-clover-sub">{selected}</p>
        <div className="grid gap-2">
          {selectedItems.slice(0, 5).map((item, index) => <p key={`${item.type}-${index}`} className="text-sm"><b>{item.label || item.badge}</b> · {item.displayTitle}</p>)}
          {!selectedItems.length && <p className="text-sm text-clover-sub">No date-based items.</p>}
        </div>
      </div>
    </GlassCard>
  );
}

import { formatMonth, monthMatrix, toDateKey } from "../../lib/utils/date";

const toneClass = {
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-700",
  mint: "bg-clover-mint text-clover-deep",
  gray: "bg-slate-100 text-slate-600"
};

export default function MonthCalendar({ year, month, itemsByDate, selectedDate, onSelectDate, onMoveMonth, onToday }) {
  return (
    <section className="glass rounded-[28px] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button className="rounded-full bg-white/55 px-4 py-2 text-sm font-bold text-clover-sub" onClick={() => onMoveMonth(-1)}>Prev</button>
        <h2 className="text-xl font-bold">{formatMonth(year, month)}</h2>
        <div className="flex gap-2">
          <button className="rounded-full bg-white/55 px-4 py-2 text-sm font-bold text-clover-sub" onClick={onToday}>Today</button>
          <button className="rounded-full bg-white/55 px-4 py-2 text-sm font-bold text-clover-sub" onClick={() => onMoveMonth(1)}>Next</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-clover-sub">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {monthMatrix(year, month).map((cell) => {
          const items = itemsByDate[cell.date] || [];
          return (
            <button
              key={cell.date}
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-24 rounded-[18px] bg-white/45 p-2 text-left transition hover:bg-white/70 ${!cell.inMonth ? "opacity-40" : ""} ${cell.isToday ? "ring-2 ring-clover-deep" : ""} ${selectedDate === cell.date ? "bg-clover-mint/60" : ""}`}
            >
              <span className="text-sm font-bold">{cell.day}</span>
              <div className="mt-2 grid gap-1">
                {items.slice(0, 3).map((item, index) => (
                  <span key={`${item.type}-${index}`} className={`truncate rounded-full px-2 py-1 text-[10px] font-bold ${toneClass[item.tone] || toneClass.gray}`}>
                    {item.badge || item.label} {item.displayTitle}
                  </span>
                ))}
                {items.length > 3 && <span className="text-[10px] font-bold text-clover-sub">+{items.length - 3} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

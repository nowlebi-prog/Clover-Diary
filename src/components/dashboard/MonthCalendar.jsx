import { formatMonth, monthMatrix } from "../../lib/utils/date";

const itemClass = {
  event: "border-emerald-100 bg-emerald-50 text-emerald-800",
  todo: "border-slate-100 bg-slate-50 text-slate-700",
  content: "border-sky-100 bg-sky-50 text-sky-800",
  payment: "border-rose-100 bg-rose-50 text-rose-800",
  recurring: "border-indigo-100 bg-indigo-50 text-indigo-800",
  campaign: "border-teal-100 bg-teal-50 text-teal-800",
  default: "border-slate-100 bg-slate-50 text-slate-700"
};

export default function MonthCalendar({ year, month, itemsByDate, selectedDate, onSelectDate, onMoveMonth, onToday }) {
  return (
    <section className="glass rounded-[24px] p-4">
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
      <div className="mt-2 grid grid-cols-7 gap-1.5 rounded-[18px] bg-white/45 p-1.5">
        {monthMatrix(year, month).map((cell) => {
          const items = itemsByDate[cell.date] || [];
          const isSelected = selectedDate === cell.date;
          return (
            <button
              key={cell.date}
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-32 rounded-xl border p-2 text-left transition hover:bg-white hover:shadow-sm ${!cell.inMonth ? "border-transparent bg-white/25 opacity-45" : "border-slate-100 bg-white/65"} ${cell.isToday ? "border-clover-deep bg-clover-mint/25" : ""} ${isSelected ? "border-orange-300 bg-orange-50/70 ring-2 ring-orange-200" : ""}`}
            >
              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-black ${cell.isToday ? "bg-clover-deep text-white" : isSelected ? "text-orange-600" : "text-clover-ink"}`}>
                {cell.day}
              </span>
              <div className="mt-2 grid gap-1">
                {items.slice(0, 4).map((item, index) => (
                  <span
                    key={`${item.type}-${index}`}
                    className={`block truncate rounded-md border px-2 py-1 text-[11px] font-bold leading-tight ${item.isImportant ? "border-orange-200 bg-orange-100 text-orange-800 shadow-[inset_3px_0_0_rgba(249,115,22,0.55)]" : itemClass[item.type] || itemClass.default}`}
                    title={item.displayTitle}
                  >
                    {item.isImportant ? "!" : ""} {item.displayTitle}
                  </span>
                ))}
                {items.length > 4 && <span className="rounded-md bg-white/70 px-2 py-1 text-[10px] font-bold text-clover-sub">+{items.length - 4} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { addDays, toDateKey } from "../../lib/utils/date";
import { getTodayItems } from "../../lib/utils/dashboardSelectors";
import StatusBadge from "../common/StatusBadge";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeeklyStripCalendar({ data, today }) {
  const [selected, setSelected] = useState(today);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index)), [today]);
  const selectedItems = getTodayItems(data, selected);

  return (
    <section className="glass rounded-[28px] bg-white/62 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-clover-deep">Week plan</p>
          <h2 className="text-lg font-bold">이번 주 캘린더</h2>
        </div>
        <span className="text-xs font-bold text-clover-sub">{selected}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dates.map((date) => {
          const day = new Date(`${date}T00:00:00`);
          const items = getTodayItems(data, date);
          const isToday = date === today;
          const isSelected = date === selected;
          return (
            <button
              key={date}
              onClick={() => setSelected(date)}
              className={`rounded-2xl px-2 py-3 text-center transition ${
                isSelected ? "bg-clover-deep text-white" : isToday ? "bg-clover-mint text-clover-deep" : "bg-white/55 text-clover-text"
              }`}
            >
              <p className="text-[11px] font-bold opacity-80">{weekDays[day.getDay()]}</p>
              <p className="mt-1 text-lg font-black">{day.getDate()}</p>
              <div className="mt-1 flex justify-center gap-1">
                {items.slice(0, 3).map((item, index) => (
                  <span key={`${item.type}-${index}`} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-clover-deep"}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-[22px] bg-white/48 p-4">
        <div className="mb-3 flex items-center gap-2">
          {selected === today && <StatusBadge tone="blue">Today</StatusBadge>}
          <b>{new Date(`${selected}T00:00:00`).getDate()}일 세부 항목</b>
        </div>
        <div className="grid gap-2">
          {selectedItems.slice(0, 5).map((item, index) => (
            <p key={`${item.type}-${index}`} className="text-sm text-clover-text">
              <span className="mr-2 font-black text-clover-deep">•</span>
              <b>{item.label}</b> {item.displayTitle}
            </p>
          ))}
          {!selectedItems.length && <p className="text-sm text-clover-sub">이 날은 아직 비어 있어요.</p>}
        </div>
      </div>
    </section>
  );
}

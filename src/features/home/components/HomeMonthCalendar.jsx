import { addDays, toDateKey } from "../../../lib/utils/date";

const dayNames = ["월", "화", "수", "목", "금", "토", "일"];

const itemTone = {
  event: "bg-[#DFF5C9] text-[#577616]",
  todo: "bg-[#D9F0F7] text-[#257085]",
  content: "bg-[#FFE7A8] text-[#92721A]",
  payment: "bg-[#FFD6C2] text-[#A3502B]",
  expense: "bg-[#FFD6C2] text-[#A3502B]",
  subscription: "bg-[#EFE3FF] text-[#6D4D9C]",
  campaign: "bg-[#CDEED7] text-[#2F7E4F]",
  recurring: "bg-[#E8ECF7] text-[#52607C]",
  default: "bg-[#EAF0F0] text-[#5C6A6A]"
};

const startOfWeek = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return toDateKey(date);
};

function CalendarItem({ item }) {
  const tone = itemTone[item.type] || itemTone.default;
  return (
    <span title={item.displayTitle} className={`block truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>
      {item.displayTitle}
    </span>
  );
}

export default function HomeMonthCalendar({ itemsByDate, selectedDate, onSelectDate, onToday }) {
  const today = toDateKey(new Date());
  const todayDay = new Date(`${today}T00:00:00`).getDay();
  const showNextWeek = todayDay === 0 || todayDay >= 5;
  const firstDay = startOfWeek(today);
  const days = Array.from({ length: showNextWeek ? 14 : 7 }, (_, index) => {
    const date = addDays(firstDay, index);
    const day = new Date(`${date}T00:00:00`).getDay();
    return { date, dayName: dayNames[(day + 6) % 7], day: Number(date.slice(-2)), isToday: date === today };
  });

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_18px_50px_rgba(70,95,80,0.07)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-lg font-black text-slate-900">주간 캘린더</p>
          <p className="text-xs font-bold text-slate-400">{showNextWeek ? "이번 주와 다음 주를 함께 봐요." : "이번 주 일정만 가볍게 확인해요."}</p>
        </div>
        <button type="button" onClick={onToday} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white">
          오늘
        </button>
      </div>

      <div className={`grid bg-white ${showNextWeek ? "grid-cols-7 md:grid-cols-14" : "grid-cols-7"}`}>
        {days.map((cell) => {
          const items = itemsByDate[cell.date] || [];
          const isSelected = selectedDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-[94px] border-t border-r border-slate-100 p-2 text-left transition hover:bg-[#F9FCFA] ${
                isSelected ? "bg-[#F6FBF8] ring-2 ring-inset ring-clover-primary/70" : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400">{cell.dayName}</span>
                <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-black ${cell.isToday ? "bg-slate-900 text-white" : "text-slate-800"}`}>
                  {cell.day}
                </span>
              </div>
              <div className="grid gap-1">
                {items.slice(0, 2).map((item, index) => <CalendarItem key={`${item.type}-${item.id || index}`} item={item} />)}
                {items.length > 2 && <span className="text-[10px] font-black text-slate-400">+{items.length - 2}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

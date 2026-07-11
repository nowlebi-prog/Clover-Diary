import { toDateKey } from "../../../lib/utils/date";

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

const itemTone = {
  event: "bg-[#DFF5C9] text-[#577616] border-[#CDE9A8]",
  todo: "bg-[#D9F0F7] text-[#257085] border-[#BDE3EE]",
  content: "bg-[#FFE7A8] text-[#92721A] border-[#F7D985]",
  payment: "bg-[#FFD6C2] text-[#A3502B] border-[#F8BE9F]",
  expense: "bg-[#FFD6C2] text-[#A3502B] border-[#F8BE9F]",
  subscription: "bg-[#EFE3FF] text-[#6D4D9C] border-[#DDC8FF]",
  campaign: "bg-[#CDEED7] text-[#2F7E4F] border-[#AEE0BF]",
  recurring: "bg-[#E8ECF7] text-[#52607C] border-[#D8DEEE]",
  default: "bg-[#EAF0F0] text-[#5C6A6A] border-[#DDE7E7]"
};

const monthMatrixSunday = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);
    return {
      date: dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: dateKey === toDateKey(new Date()),
      dayOfWeek: date.getDay()
    };
  });
};

const monthLabel = (year, month) => `${month + 1}월`;

function CalendarItem({ item }) {
  const tone = itemTone[item.type] || itemTone.default;
  return (
    <span
      title={item.displayTitle}
      className={`block truncate rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold leading-tight md:text-[11px] ${tone}`}
    >
      {item.displayTitle}
    </span>
  );
}

export default function HomeMonthCalendar({ year, month, itemsByDate, selectedDate, onSelectDate, onMoveMonth, onToday }) {
  const cells = monthMatrixSunday(year, month);

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_22px_70px_rgba(70,95,80,0.08)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="메뉴"
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-xl font-black text-slate-700"
          >
            ≡
          </button>
          <div>
            <p className="text-lg font-black text-slate-900">개인</p>
            <p className="text-xs font-bold text-slate-400">오늘의 일정과 할 일</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToday} className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-sm font-black text-slate-700" aria-label="오늘">
            {new Date().getDate()}
          </button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-lg font-black text-slate-700" aria-label="검색">
            ⌕
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMoveMonth(-1)} className="rounded-full bg-white px-3 py-2 text-sm font-black text-slate-400 shadow-sm">
            이전
          </button>
          <button type="button" className="rounded-full border border-slate-100 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-sm">
            {monthLabel(year, month)}
          </button>
          <button type="button" onClick={() => onMoveMonth(1)} className="rounded-full bg-white px-3 py-2 text-sm font-black text-slate-400 shadow-sm">
            다음
          </button>
        </div>
        <button type="button" aria-label="월간 보기" className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-lg text-slate-600">
          ▦
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-white text-center text-xs font-black text-slate-400">
        {dayNames.map((day, index) => (
          <div key={day} className={`py-2 ${index === 0 ? "text-coral" : index === 6 ? "text-sky-500" : ""}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-white">
        {cells.map((cell) => {
          const items = itemsByDate[cell.date] || [];
          const isSelected = selectedDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-[94px] border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-[#F9FCFA] md:min-h-[118px] ${!cell.inMonth ? "bg-slate-50/40 text-slate-300" : "text-slate-900"} ${isSelected ? "bg-[#F6FBF8]" : ""}`}
            >
              <span
                className={`mb-1 inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-black ${
                  cell.isToday
                    ? "bg-slate-800 text-white"
                    : cell.dayOfWeek === 0
                      ? "text-coral"
                      : cell.dayOfWeek === 6
                        ? "text-sky-500"
                        : "text-slate-800"
                }`}
              >
                {cell.day}
              </span>
              <div className="grid gap-0.5">
                {items.slice(0, 4).map((item, index) => (
                  <CalendarItem key={`${item.type}-${item.id || index}`} item={item} />
                ))}
                {items.length > 4 && <span className="text-[10px] font-black text-slate-400">+{items.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

const weekLabels = ["월", "화", "수", "목", "금", "토", "일"];

const statusClass = ({ checked, future, isToday }) => {
  if (future) return "bg-slate-100 text-slate-300";
  if (checked) return "bg-emerald-400 text-white shadow-sm";
  if (isToday) return "border border-red-300 bg-white text-red-500";
  return "bg-red-50 text-red-400";
};

export default function HabitMonthView({ habits, logs, days, today }) {
  const todayKey = toDateKey(today);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {habits.map((habit) => {
        const done = days.filter((day) => isHabitDoneOn(habit.id, logs, day)).length;
        const rate = Math.round((done / days.length) * 100);

        return (
          <article key={habit.id} className="rounded-[24px] bg-white/60 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-clover-sub">월간 신호등 캘린더</p>
                <h3 className="mt-1 font-bold text-clover-text">{habit.name}</h3>
              </div>
              <span className="rounded-full bg-clover-mint px-3 py-1 text-sm font-bold text-clover-deep">{rate}%</span>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold text-clover-sub">
              {weekLabels.map((day) => <span key={day}>{day}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const future = day > todayKey;
                const checked = isHabitDoneOn(habit.id, logs, day);
                const isToday = day === todayKey;

                return (
                  <span
                    key={day}
                    className={`grid aspect-square place-items-center rounded-full text-[12px] font-bold ${statusClass({ checked, future, isToday })}`}
                  >
                    {new Date(`${day}T00:00:00`).getDate()}
                  </span>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-clover-sub">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">초록: 지킨 날</span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-500">빨강: 못 지킨 날</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

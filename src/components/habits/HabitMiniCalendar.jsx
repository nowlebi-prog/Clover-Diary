import { isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

export default function HabitMiniCalendar({ habit, logs, month, today }) {
  const year = today.getFullYear();
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => toDateKey(new Date(year, month, index + 1)));
  const rate = Math.round((days.filter((day) => isHabitDoneOn(habit.id, logs, day)).length / days.length) * 100);
  return (
    <div className="rounded-2xl bg-white/45 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-clover-text">{new Date(year, month, 1).toLocaleString("en", { month: "long" })}</p>
        <p className="text-xs font-bold text-clover-sub">{rate}%</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const checked = isHabitDoneOn(habit.id, logs, day);
          const future = day > toDateKey(today);
          return <span key={day} className="h-3 rounded" style={{ background: checked ? habit.color : "#ECEFED", opacity: future ? 0.35 : 1 }} />;
        })}
      </div>
    </div>
  );
}

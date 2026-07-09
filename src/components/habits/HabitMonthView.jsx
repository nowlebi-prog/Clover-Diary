import { isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

export default function HabitMonthView({ habits, logs, days, today }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {habits.map((habit) => {
        const done = days.filter((day) => isHabitDoneOn(habit.id, logs, day)).length;
        return (
          <article key={habit.id} className="rounded-[24px] bg-white/55 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">{habit.name}</h3>
              <span className="text-sm font-bold text-clover-deep">{Math.round((done / days.length) * 100)}%</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const future = day > toDateKey(today);
                const checked = isHabitDoneOn(habit.id, logs, day);
                return (
                  <span
                    key={day}
                    className={`grid aspect-square place-items-center rounded-lg text-[11px] font-bold ${day === toDateKey(today) ? "ring-2 ring-clover-deep" : ""}`}
                    style={{ background: checked ? habit.color : "#ECEFED", color: checked ? "white" : "#7A887F", opacity: future ? 0.35 : 1 }}
                  >
                    {new Date(`${day}T00:00:00`).getDate()}
                  </span>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}

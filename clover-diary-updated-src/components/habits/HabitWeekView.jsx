import { isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

const label = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitWeekView({ habits, logs, days, today }) {
  return (
    <div className="grid gap-3">
      {habits.map((habit) => {
        const done = days.filter((day) => isHabitDoneOn(habit.id, logs, day)).length;
        return (
          <div key={habit.id} className="rounded-[22px] bg-white/55 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-bold">{habit.name}</p>
              <p className="text-xs font-bold text-clover-sub">{done}/7 · {Math.round((done / 7) * 100)}%</p>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const checked = isHabitDoneOn(habit.id, logs, day);
                const isToday = day === toDateKey(today);
                return (
                  <div key={day} className="grid gap-1 text-center">
                    <span className="text-[11px] text-clover-sub">{label[index]}</span>
                    <span className={`grid h-9 place-items-center rounded-xl text-xs font-bold ${isToday ? "ring-2 ring-clover-deep" : ""}`} style={{ background: checked ? habit.color : "#ECEFED", color: checked ? "white" : "#7A887F" }}>
                      {checked ? "✓" : new Date(`${day}T00:00:00`).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

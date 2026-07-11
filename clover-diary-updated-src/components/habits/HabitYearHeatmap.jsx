import HabitMiniCalendar from "./HabitMiniCalendar";

export default function HabitYearHeatmap({ habits, logs, today }) {
  const month = today.getMonth();
  const months = [Math.max(0, month - 1), month, Math.min(11, month + 1)];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {habits.map((habit) => (
        <article key={habit.id} className="rounded-[24px] bg-white/55 p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl text-xs font-black text-white" style={{ background: habit.color }}>{habit.icon}</span>
            <div>
              <h3 className="font-bold">{habit.name}</h3>
              <p className="text-xs text-clover-sub">Yearly heatmap preview</p>
            </div>
          </div>
          <div className="grid gap-3">
            {months.map((item) => <HabitMiniCalendar key={item} habit={habit} logs={logs} month={item} today={today} />)}
          </div>
        </article>
      ))}
    </div>
  );
}

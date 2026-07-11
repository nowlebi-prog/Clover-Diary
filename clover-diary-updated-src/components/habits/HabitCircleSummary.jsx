import { getHabitCompletionRate, isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

const monthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export default function HabitCircleSummary({ habits = [], logs = [], onToggle }) {
  const { start, end } = monthRange();
  const today = toDateKey(new Date());
  const active = habits.filter((habit) => habit.status !== "archived").slice(0, 4);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {active.map((habit) => {
        const rate = getHabitCompletionRate(habit.id, logs, start, end);
        const doneToday = isHabitDoneOn(habit.id, logs, today);
        const background = `conic-gradient(${habit.color || "#3E8F63"} ${rate * 3.6}deg, rgba(255,255,255,.7) 0deg)`;
        return (
          <button key={habit.id} onClick={() => onToggle?.(habit.id)} className="rounded-[22px] bg-white/48 p-4 text-left">
            <div className="flex items-center gap-3">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background }}>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-black">
                  {rate}%
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xl">{habit.icon || "🌱"}</p>
                <p className="truncate text-sm font-bold">{habit.name}</p>
                <p className="mt-1 text-xs text-clover-sub">{doneToday ? "오늘도 해냈어요!" : "오늘 체크하기"}</p>
              </div>
            </div>
          </button>
        );
      })}
      {!active.length && <p className="text-sm text-clover-sub">Life에서 루틴을 추가해보세요.</p>}
    </div>
  );
}

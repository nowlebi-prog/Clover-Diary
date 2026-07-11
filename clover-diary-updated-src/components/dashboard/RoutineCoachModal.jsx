import { useMemo } from "react";
import AppButton from "../common/AppButton";
import { addDays, toDateKey } from "../../lib/utils/date";
import { getActiveHabits, isHabitDoneOn } from "../../lib/utils/habitSelectors";

const weekDays = (today) => Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));

export default function RoutineCoachModal({ data, today = toDateKey(new Date()), onClose }) {
  const summary = useMemo(() => {
    const days = weekDays(today);
    const habits = getActiveHabits(data.habits || []).map((habit) => {
      const doneDays = days.filter((day) => isHabitDoneOn(habit.id, data.habitLogs || [], day));
      return { habit, doneDays, missed: days.length - doneDays.length, rate: Math.round((doneDays.length / days.length) * 100) };
    });
    const perfect = habits.filter((item) => item.doneDays.length === days.length);
    const struggling = habits.filter((item) => item.doneDays.length === 0);
    const weak = habits.filter((item) => item.doneDays.length > 0 && item.doneDays.length <= 2);
    const target = struggling[0] || weak[0] || perfect[0] || habits[0];
    const mode = perfect.length && !struggling.length && !weak.length ? "celebrate" : target?.doneDays.length === 0 ? "rest" : target?.doneDays.length <= 2 ? "nudge" : "celebrate";
    return { days, perfect, struggling, weak, target, mode };
  }, [data, today]);

  if (!summary.target) return null;

  const habitName = summary.target.habit.name || summary.target.habit.title || "루틴";
  const isCelebrate = summary.mode === "celebrate";
  const title = isCelebrate ? `${habitName} 달성 축하해요!` : `${habitName} 잠시 쉬어갈래요?`;
  const message = isCelebrate
    ? `이번 주 ${summary.target.doneDays.length}일 모두 지켰어요. 작지만 진짜 멋진 반복이에요.`
    : `${habitName} 안 지킨 지 ${summary.target.missed}일째예요. 괜찮아요, 다음 주에는 아주 작게 다시 시작해봐요.`;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-black/25 p-0 sm:place-items-center sm:p-6">
      <section className="glass w-full rounded-t-[30px] p-6 text-center sm:max-w-sm sm:rounded-[30px]">
        <button type="button" onClick={onClose} className="mb-2 ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/60 text-clover-sub">×</button>
        <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-5xl ${isCelebrate ? "bg-emerald-100" : "bg-amber-100"}`}>
          {isCelebrate ? "🎉" : "🥺"}
        </div>
        <h2 className="mt-5 text-xl font-bold text-clover-text">{title}</h2>
        <p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-clover-sub">{message}</p>
        <div className="mt-5 grid grid-cols-7 gap-1">
          {summary.days.map((day) => {
            const done = isHabitDoneOn(summary.target.habit.id, data.habitLogs || [], day);
            return <span key={day} className={`h-2 rounded-full ${done ? "bg-emerald-400" : "bg-white/70"}`} />;
          })}
        </div>
        <AppButton className="mt-6 w-full" onClick={onClose}>{isCelebrate ? "고마워" : "응, 쉬어갈래"}</AppButton>
      </section>
    </div>
  );
}

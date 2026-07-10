import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import { getAllData, saveAllData, toggleHabitLog } from "../../lib/storage/localStorageAdapter";
import { getHabitCompletionRate, isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";

const emojiOptions = ["🔥", "🏃", "💧", "🧘", "📚", "💊", "🍀", "💪", "✍️", "🧠", "🧹", "💗"];

const makeMonthDays = (base = new Date()) => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, index) => {
    const date = new Date(year, month, index + 1);
    return toDateKey(date);
  });
};

const monthLabel = (base = new Date()) => `${base.getFullYear()}년 ${base.getMonth() + 1}월`;

export default function LifeHabitTracker({ data, onChange }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [toast, setToast] = useState("");
  const today = toDateKey(new Date());
  const days = useMemo(() => makeMonthDays(), []);
  const start = days[0];
  const end = days[days.length - 1];
  const habits = (data.habits || []).filter((habit) => habit.status !== "archived");

  useEffect(() => {
    const missedHabit = habits.find((habit) => {
      const lastThree = [0, 1, 2].map((amount) => {
        const date = new Date();
        date.setDate(date.getDate() - amount);
        return toDateKey(date);
      });
      return !lastThree.some((date) => isHabitDoneOn(habit.id, data.habitLogs || [], date));
    });
    if (missedHabit) setToast(`${missedHabit.icon || "🍀"} 잊지 않으셨죠? ${missedHabit.name}도 기다리고 있어요.`);
  }, []);

  const addHabit = () => {
    if (!name.trim()) return;
    const next = getAllData();
    const createdAt = today;
    next.habits = [
      {
        id: `habit-${Date.now()}`,
        name: name.trim(),
        icon: emoji,
        color: "#14B8A6",
        frequencyType: "daily",
        targetCount: 7,
        customDays: [],
        reminderTime: "",
        memo: "",
        status: "active",
        createdAt,
        updatedAt: createdAt
      },
      ...(next.habits || [])
    ];
    saveAllData(next);
    setName("");
    onChange?.();
  };

  const toggle = (habit, date) => {
    toggleHabitLog(habit.id, date);
    if (date === today && !isHabitDoneOn(habit.id, data.habitLogs || [], date)) {
      setToast(`${habit.icon || "🙂"} 오늘도 해냈어요! 🙂`);
    }
    onChange?.();
  };

  return (
    <section className="glass overflow-hidden rounded-[22px] bg-white/72 p-5">
      {toast && (
        <div className="fixed left-1/2 top-6 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full bg-clover-deep px-5 py-3 text-sm font-bold text-white shadow-glass">
          <span className="truncate">{toast}</span>
          <button className="shrink-0 text-white/80" onClick={() => setToast("")}>닫기</button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-clover-ink">🔥 습관 히트맵</h2>
          <p className="mt-1 text-xs font-bold text-clover-sub">{monthLabel()}</p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <AppInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addHabit();
            }}
            placeholder="새 습관 입력"
            className="min-w-[180px]"
          />
          <AppSelect value={emoji} onChange={(event) => setEmoji(event.target.value)} className="w-20">
            {emojiOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </AppSelect>
          <AppButton onClick={addHabit}>추가</AppButton>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[150px_1fr] gap-3">
            <div />
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(20px, 1fr))` }}>
              {days.map((date) => {
                const day = new Date(`${date}T00:00:00`).getDate();
                return (
                  <span key={date} className={`text-center text-[10px] font-bold ${date === today ? "text-clover-deep" : "text-clover-sub/65"}`}>
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-2 grid gap-1.5">
            {habits.map((habit) => {
              const rate = getHabitCompletionRate(habit.id, data.habitLogs || [], start, end);
              const doneToday = isHabitDoneOn(habit.id, data.habitLogs || [], today);
              return (
                <div key={habit.id} className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <button
                    onClick={() => toggle(habit, today)}
                    className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-left transition hover:bg-white/70"
                    title="누르면 오늘 날짜가 체크돼요"
                  >
                    <span className="text-base">{habit.icon || "🍀"}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black text-clover-ink">{habit.name}</span>
                      <span className="text-[10px] font-bold text-clover-sub">
                        {rate}% {doneToday ? "완료" : "진행 중"}
                      </span>
                    </span>
                  </button>

                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(20px, 1fr))` }}>
                    {days.map((date) => {
                      const done = isHabitDoneOn(habit.id, data.habitLogs || [], date);
                      const future = date > today;
                      return (
                        <button
                          key={date}
                          onClick={() => toggle(habit, date)}
                          className={`h-7 rounded-md border transition ${done ? "border-teal-500 bg-teal-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)]" : "border-slate-100 bg-slate-100"} ${date === today ? "ring-2 ring-orange-300" : ""} ${future ? "opacity-45" : "hover:scale-105 hover:bg-teal-100"}`}
                          title={`${date} ${habit.name}`}
                          aria-label={`${date} ${habit.name} 체크`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!habits.length && (
              <div className="rounded-2xl bg-white/55 p-5 text-sm font-bold text-clover-sub">
                아직 습관이 없어요. 오른쪽 위 입력창에 하나 적고 추가를 눌러보세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

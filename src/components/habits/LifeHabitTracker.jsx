import { useMemo, useState } from "react";
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
  return Array.from({ length: last }, (_, index) => toDateKey(new Date(year, month, index + 1)));
};

const monthLabel = (base = new Date()) => `${base.getFullYear()}년 ${base.getMonth() + 1}월`;

export default function LifeHabitTracker({ data, onChange }) {
  const [toast, setToast] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);
  const today = toDateKey(new Date());
  const days = useMemo(() => makeMonthDays(), []);
  const start = days[0];
  const end = days[days.length - 1];
  const habits = (data.habits || []).filter((habit) => habit.status !== "archived");

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
        <AppButton onClick={() => setManagerOpen(true)}>편집</AppButton>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[150px_1fr] gap-3">
            <div />
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(20px, 1fr))` }}>
              {days.map((date) => (
                <span key={date} className={`text-center text-[10px] font-bold ${date === today ? "text-clover-deep" : "text-clover-sub/65"}`}>
                  {new Date(`${date}T00:00:00`).getDate()}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 grid gap-1.5">
            {habits.map((habit) => {
              const rate = getHabitCompletionRate(habit.id, data.habitLogs || [], start, end);
              const doneToday = isHabitDoneOn(habit.id, data.habitLogs || [], today);
              return (
                <div key={habit.id} className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <button onClick={() => toggle(habit, today)} className="flex min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-left transition hover:bg-white/70">
                    <span className="text-base">{habit.icon || "🍀"}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black text-clover-ink">{habit.name}</span>
                      <span className="text-[10px] font-bold text-clover-sub">{rate}% · {doneToday ? "오늘 완료" : "오늘 미완료"}</span>
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
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!habits.length && <div className="rounded-2xl bg-white/55 p-5 text-sm font-bold text-clover-sub">아직 습관이 없어요. 편집을 눌러 하나 추가해보세요.</div>}
          </div>
        </div>
      </div>

      {managerOpen && <HabitManager data={data} today={today} onClose={() => setManagerOpen(false)} onChange={onChange} />}
    </section>
  );
}

function HabitManager({ data, today, onClose, onChange }) {
  const [drafts, setDrafts] = useState(() => (data.habits || []).filter((habit) => habit.status !== "archived"));

  const updateDraft = (id, updates) => setDrafts((current) => current.map((habit) => habit.id === id ? { ...habit, ...updates } : habit));
  const addDraft = () => {
    setDrafts((current) => [
      {
        id: `habit-${Date.now()}`,
        name: "",
        icon: "🔥",
        color: "#14B8A6",
        frequencyType: "daily",
        targetCount: 7,
        customDays: [],
        reminderTime: "",
        memo: "",
        status: "active",
        createdAt: today,
        updatedAt: today
      },
      ...current
    ]);
  };
  const archiveDraft = (id) => setDrafts((current) => current.map((habit) => habit.id === id ? { ...habit, status: "archived" } : habit));
  const save = () => {
    const next = getAllData();
    const archived = (next.habits || []).filter((habit) => habit.status === "archived");
    next.habits = [...drafts.filter((habit) => habit.name.trim()), ...archived].map((habit) => ({ ...habit, updatedAt: today }));
    saveAllData(next);
    onChange?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-clover-ink/20 px-4 backdrop-blur-sm">
      <section className="glass max-h-[86vh] w-full max-w-2xl overflow-auto rounded-[28px] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Habit editor</p>
            <h3 className="text-xl font-black">습관 추가/수정</h3>
          </div>
          <button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" onClick={onClose}>닫기</button>
        </div>
        <div className="grid gap-3">
          {drafts.filter((habit) => habit.status !== "archived").map((habit) => (
            <div key={habit.id} className="grid gap-2 rounded-2xl bg-slate-50 p-3 md:grid-cols-[80px_1fr_120px_auto]">
              <AppSelect value={habit.icon || "🔥"} onChange={(event) => updateDraft(habit.id, { icon: event.target.value })}>
                {emojiOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </AppSelect>
              <AppInput value={habit.name || ""} onChange={(event) => updateDraft(habit.id, { name: event.target.value })} placeholder="습관 이름" />
              <AppInput type="time" value={habit.reminderTime || ""} onChange={(event) => updateDraft(habit.id, { reminderTime: event.target.value })} />
              <button className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-600" onClick={() => archiveDraft(habit.id)}>삭제</button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <AppButton variant="soft" onClick={addDraft}>+ 습관 추가</AppButton>
          <AppButton onClick={save}>저장</AppButton>
        </div>
      </section>
    </div>
  );
}

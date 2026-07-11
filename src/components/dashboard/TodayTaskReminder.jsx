import { useEffect, useMemo, useState } from "react";
import { getAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const slots = {
  morning: { hour: 9, label: "오전 체크", message: "오늘 먼저 챙길 일이 있어요." },
  evening: { hour: 19, label: "저녁 리마인드", message: "아직 남은 일을 한 번 더 확인해볼까요?" }
};

const getSlot = (date = new Date()) => {
  const hour = date.getHours();
  if (hour >= slots.evening.hour) return "evening";
  if (hour >= slots.morning.hour) return "morning";
  return null;
};

const nextSlotDelay = (date = new Date()) => {
  const next = new Date(date);
  const slot = date.getHours() < slots.morning.hour ? slots.morning : slots.evening;
  next.setHours(slot.hour, 0, 0, 0);
  if (next <= date) {
    next.setDate(next.getDate() + 1);
    next.setHours(slots.morning.hour, 0, 0, 0);
  }
  return next.getTime() - date.getTime();
};

const reminderKey = (today, slot) => `clover-today-task-reminder-${today}-${slot}`;

const getTodayTasks = (data, today) =>
  (data.todos || [])
    .filter((todo) => !todo.completed && todo.dueDate === today)
    .sort((a, b) => {
      const first = a.startTime || a.dueTime || "99:99";
      const second = b.startTime || b.dueTime || "99:99";
      return first.localeCompare(second);
    });

export default function TodayTaskReminder() {
  const [data, setData] = useState(() => getAllData());
  const [activeSlot, setActiveSlot] = useState(null);
  const today = toDateKey(new Date());

  const tasks = useMemo(() => getTodayTasks(data, today), [data, today]);
  const visibleTasks = tasks.slice(0, 3);

  useEffect(() => {
    const load = () => setData(getAllData());
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  useEffect(() => {
    let timer;

    const check = () => {
      const slot = getSlot();
      if (slot && tasks.length && !localStorage.getItem(reminderKey(today, slot))) {
        setActiveSlot(slot);
      }
      timer = window.setTimeout(check, Math.min(nextSlotDelay(), 2147483647));
    };

    check();
    return () => window.clearTimeout(timer);
  }, [tasks.length, today]);

  if (!activeSlot || !visibleTasks.length) return null;

  const close = () => {
    localStorage.setItem(reminderKey(today, activeSlot), "seen");
    setActiveSlot(null);
  };

  const slotInfo = slots[activeSlot];

  return (
    <div className="pointer-events-none fixed inset-x-3 top-4 z-[70] mx-auto grid max-w-md gap-2 sm:inset-x-auto sm:right-6 sm:top-6">
      <div className="pointer-events-auto overflow-hidden rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(54,72,96,0.18)] backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-clover-sub">{slotInfo.label}</p>
            <h2 className="mt-1 text-base font-black text-clover-text">{slotInfo.message}</h2>
          </div>
          <button type="button" onClick={close} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-clover-sub transition hover:bg-white hover:text-clover-deep">
            닫기
          </button>
        </div>

        <div className="grid gap-2">
          {visibleTasks.map((task, index) => (
            <article key={task.id} className="-mx-1 grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-[20px] bg-white/85 px-3 py-3 shadow-sm" style={{ transform: `translateX(${index * 10}px)` }}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-lg font-black text-violet-600">✓</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-clover-text">{task.title || "오늘 할 일"}</p>
                <p className="truncate text-xs font-semibold text-clover-sub">
                  {task.startTime || task.dueTime ? `${task.startTime || task.dueTime}에 시작` : task.category || task.project || "오늘 해야 할 일"}
                </p>
              </div>
              <span className="text-xs font-bold text-clover-sub">지금</span>
            </article>
          ))}
        </div>

        {tasks.length > visibleTasks.length && (
          <p className="mt-3 text-center text-xs font-bold text-clover-sub">외 {tasks.length - visibleTasks.length}개가 더 남아 있어요.</p>
        )}
      </div>
    </div>
  );
}

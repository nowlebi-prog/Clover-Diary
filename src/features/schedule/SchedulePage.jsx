import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import HomeMonthCalendar from "../home/components/HomeMonthCalendar";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems, getTodayItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

function DayDetailsCompact({ data, selectedDate, onChange }) {
  const items = [
    ...(data.todos || []).filter((item) => item.dueDate === selectedDate).map((item) => ({ ...item, collection: "todos", typeLabel: "할 일", field: "title" })),
    ...(data.events || []).filter((item) => item.date === selectedDate).map((item) => ({ ...item, collection: "events", typeLabel: "일정", field: "title" })),
    ...(data.payments || []).filter((item) => item.expectedDate === selectedDate).map((item) => ({ ...item, collection: "payments", typeLabel: "Money", field: "project" })),
    ...(data.expenses || []).filter((item) => item.date === selectedDate).map((item) => ({ ...item, collection: "expenses", typeLabel: "지출", field: "title" }))
  ];

  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    onChange();
  };

  const updateItem = (item, updates) => {
    persist((next) => {
      next[item.collection] = (next[item.collection] || []).map((entry) => entry.id === item.id ? { ...entry, ...updates, updatedAt: selectedDate } : entry);
    });
  };

  const deleteItem = (item) => {
    persist((next) => {
      moveToTrash(next, item.collection, item);
    });
  };

  const addTodo = () => {
    persist((next) => {
      next.todos = [
        { id: makeId("todo"), title: "새 할 일", dueDate: selectedDate, category: "개인", priority: "normal", completed: false, subTasks: [], memo: "", createdAt: selectedDate, updatedAt: selectedDate },
        ...(next.todos || [])
      ];
    });
  };

  const addEvent = () => {
    persist((next) => {
      next.events = [
        { id: makeId("event"), title: "새 일정", date: selectedDate, time: "09:00", category: "개인", memo: "", createdAt: selectedDate, updatedAt: selectedDate },
        ...(next.events || [])
      ];
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>{selectedDate.slice(5)} 전체 할일</SectionTitle>
        <div className="flex gap-1.5">
          <button type="button" onClick={addTodo} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-deep shadow-sm">+ 할 일</button>
          <button type="button" onClick={addEvent} className="rounded-full bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm">+ 일정</button>
        </div>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <div key={`${item.collection}-${item.id}`} className="grid gap-2 rounded-2xl bg-white/75 p-3 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex items-center gap-2">
              {item.collection === "todos" && <input type="checkbox" checked={Boolean(item.completed)} onChange={(event) => updateItem(item, { completed: event.target.checked, completedAt: event.target.checked ? selectedDate : "" })} />}
              <StatusBadge tone={item.collection === "payments" || item.collection === "expenses" ? "danger" : item.collection === "events" ? "mint" : "blue"}>{item.typeLabel}</StatusBadge>
            </div>
            <AppInput
              value={item[item.field] || ""}
              onChange={(event) => updateItem(item, { [item.field]: event.target.value })}
              className="min-h-9 rounded-xl"
            />
            <button type="button" onClick={() => deleteItem(item)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">
              삭제
            </button>
          </div>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/70 p-4 text-sm font-bold text-clover-sub">이 날짜에는 아직 항목이 없어요.</p>}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const today = toDateKey(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const defaultDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const [data, setData] = useState(getAllData());
  const [selectedDateState, setSelectedDateState] = useState(defaultDate);
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : selectedDateState;
  const initial = new Date(`${selectedDate}T00:00:00`);
  const [calendarMonth, setCalendarMonth] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const load = () => setData(getAllData());
  const setSelectedDate = (date) => {
    setSelectedDateState(date);
    const next = new URLSearchParams(searchParams);
    next.set("date", date);
    setSearchParams(next, { replace: true });
  };
  const monthItems = useMemo(() => getMonthCalendarItems(data, calendarMonth.year, calendarMonth.month), [data, calendarMonth]);
  const dayItems = useMemo(() => getTodayItems(data, selectedDate), [data, selectedDate]);

  const toggleTodoNeedMove = (item) => {
    if (item.type !== "todo") return;
    const next = getAllData();
    next.todos = (next.todos || []).map((todo) => todo.id === item.id ? { ...todo, needMove: !todo.needMove } : todo);
    saveAllData(next);
    load();
  };

  const selectedLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  return (
    <>
      <PageHeader eyebrow="SCHEDULE" title="스케줄">
        <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ 빠른 추가</AppButton>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="grid content-start gap-4">
          <HomeMonthCalendar
            year={calendarMonth.year}
            month={calendarMonth.month}
            itemsByDate={monthItems}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMoveMonth={(amount) => setCalendarMonth((current) => {
              const next = new Date(current.year, current.month + amount, 1);
              return { year: next.getFullYear(), month: next.getMonth() };
            })}
            onToday={() => {
              setCalendarMonth({ year: initial.getFullYear(), month: initial.getMonth() });
              setSelectedDate(today);
            }}
          />
          <GlassCard>
            <DayDetailsCompact data={data} selectedDate={selectedDate} onChange={load} />
          </GlassCard>
        </div>

        <GlassCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-clover-sub">Timeline</p>
              <h2 className="text-lg font-black text-clover-ink">{selectedLabel}</h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-sub">‹ 전날</button>
              <button type="button" onClick={() => setSelectedDate(today)} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-sub">오늘</button>
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-sub">다음날 ›</button>
            </div>
          </div>
          <TodayTimeline items={dayItems} onToggleNeedMove={toggleTodoNeedMove} fullDay />
        </GlassCard>
      </div>
    </>
  );
}

import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import SubPageTabs from "../../components/common/SubPageTabs";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import PageHeader from "../../components/layout/PageHeader";
import LifeHabitTracker from "../../components/habits/LifeHabitTracker";
import JournalPage from "../journal/JournalPage";
import MandalartPage from "../mandalart/MandalartPage";
import { deleteTodo, getAllData, updateTodo } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems, getTodayItems } from "../../lib/utils/dashboardSelectors";
import { monthMatrix, toDateKey } from "../../lib/utils/date";

const typeTone = {
  todo: "blue",
  event: "mint",
  payment: "danger",
  expense: "danger",
  content: "lavender",
  subscription: "warning",
  recurring: "blue",
  campaign: "mint"
};

const typeLabel = {
  todo: "할 일",
  event: "일정",
  payment: "결제",
  expense: "지출",
  content: "콘텐츠",
  subscription: "구독",
  recurring: "반복",
  campaign: "업무"
};

function LifeTabs({ active, onChange }) {
  return (
    <SubPageTabs
      items={[
        { key: "overview", label: "개요", to: "/life" },
        { key: "tasks", label: "전체 할 일", active: active === "tasks", onClick: () => onChange("tasks") },
        { key: "chores", label: "집안일", to: "/life" },
        { key: "habits", label: "습관", active: active === "habits", onClick: () => onChange("habits") },
        { key: "journal", label: "일기", active: active === "journal", onClick: () => onChange("journal") },
        { key: "mandalart", label: "만다라트", active: active === "mandalart", onClick: () => onChange("mandalart") }
      ]}
    />
  );
}

function MonthSummaryCalendar({ data, selectedDate, onSelect }) {
  const base = new Date(`${selectedDate}T00:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthItems = getMonthCalendarItems(data, year, month);
  const cells = monthMatrix(year, month);

  return (
    <GlassCard className="p-4">
      <SectionTitle>{year}년 {month + 1}월 요약</SectionTitle>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-clover-sub">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const items = monthItems[cell.date] || [];
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelect(cell.date)}
              className={`min-h-12 rounded-2xl p-1.5 text-left transition ${
                isSelected ? "bg-clover-deep text-white" : cell.inMonth ? "bg-white/65 text-clover-text hover:bg-white" : "bg-white/25 text-clover-sub"
              }`}
            >
              <span className="text-xs font-black">{cell.day}</span>
              {!!items.length && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {items.slice(0, 4).map((item, index) => (
                    <span
                      key={`${item.type}-${item.id || index}`}
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-white" : item.type === "payment" || item.type === "expense" ? "bg-rose-400" : item.type === "todo" ? "bg-sky-400" : "bg-emerald-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

function DayTaskList({ items, data, selectedDate, onChange }) {
  const todos = (data.todos || []).filter((todo) => todo.dueDate === selectedDate);
  const todoIds = new Set(todos.map((todo) => todo.id));
  const otherItems = items.filter((item) => item.type !== "todo" || !todoIds.has(item.id));
  const allItems = [...todos.map((todo) => ({ ...todo, type: "todo", displayTitle: todo.title })), ...otherItems];

  const toggleTodo = (todo, completed) => {
    updateTodo(todo.id, { completed, completedAt: completed ? selectedDate : "" });
    onChange();
  };

  const removeTodo = (id) => {
    deleteTodo(id);
    onChange();
  };

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SectionTitle>{selectedDate.slice(5)} 전체 할 일</SectionTitle>
          <p className="truncate text-xs font-bold text-clover-sub">선택한 날짜의 할 일과 일정을 한 번에 봐요.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to={`/tasks?date=${selectedDate}`} className="whitespace-nowrap rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-clover-deep">
            + 할 일
          </Link>
          <Link to={`/calendar?date=${selectedDate}&new=event`} className="whitespace-nowrap rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-blue-700">
            + 일정
          </Link>
        </div>
      </div>

      <div className="grid gap-2">
        {allItems.map((item, index) => (
          <article key={`${item.type}-${item.id || index}`} className="grid min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl bg-white/65 px-3 py-2 text-sm lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
            {item.type === "todo" ? (
              <input type="checkbox" checked={Boolean(item.completed)} onChange={(event) => toggleTodo(item, event.target.checked)} className="h-4 w-4 accent-clover-deep" />
            ) : (
              <span className="h-4 w-4 rounded-full bg-clover-mint" />
            )}
            <StatusBadge tone={typeTone[item.type] || "mint"}>{typeLabel[item.type] || item.label || "기록"}</StatusBadge>
            <div className="min-w-0">
              <p className="truncate font-black">{item.displayTitle}</p>
              {(item.time || item.startTime || item.dueTime) && <p className="text-[11px] font-bold text-clover-sub">{item.time || item.startTime || item.dueTime}</p>}
            </div>
            {item.type === "todo" && (
              <div className="col-span-3 flex shrink-0 items-center justify-end gap-1 lg:col-span-1">
                <Link to={`/tasks?edit=${item.id}`} className="whitespace-nowrap rounded-full bg-white px-2.5 py-2 text-xs font-black text-clover-deep">
                  수정
                </Link>
                <button type="button" onClick={() => removeTodo(item.id)} className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-2 text-xs font-black text-red-500">
                  삭제
                </button>
              </div>
            )}
          </article>
        ))}
        {!allItems.length && <p className="rounded-2xl bg-white/55 p-4 text-sm font-bold text-clover-sub">이 날짜에는 아직 항목이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function TasksPanel({ data, selectedDate, dayItems, onDateChange, onChange }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(300px,0.9fr)_minmax(280px,0.7fr)_minmax(300px,0.8fr)]">
      <MonthSummaryCalendar data={data} selectedDate={selectedDate} onSelect={onDateChange} />
      <DayTaskList items={dayItems} data={data} selectedDate={selectedDate} onChange={onChange} />
      <GlassCard className="min-w-0 p-4">
        <SectionTitle>타임라인</SectionTitle>
        <TodayTimeline items={dayItems} />
      </GlassCard>
    </div>
  );
}

export default function LifeTasksPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(getAllData());
  const selectedDate = params.get("date") || toDateKey(new Date());
  const activeTab = params.get("tab") || "tasks";

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const dayItems = useMemo(() => getTodayItems(data, selectedDate), [data, selectedDate]);
  const selectDate = (date) => setParams({ date, tab: activeTab });
  const selectTab = (tab) => setParams({ date: selectedDate, tab });

  return (
    <>
      <PageHeader eyebrow="LIFE" title={activeTab === "tasks" ? "전체 할 일" : "생활 허브"}>
        <Link to="/" className="rounded-full bg-white/70 px-4 py-2 text-sm font-black text-clover-deep shadow-sm">Home</Link>
      </PageHeader>

      <LifeTabs active={activeTab} onChange={selectTab} />

      {activeTab === "tasks" && <TasksPanel data={data} selectedDate={selectedDate} dayItems={dayItems} onDateChange={selectDate} onChange={load} />}
      {activeTab === "habits" && <LifeHabitTracker data={data} onChange={load} />}
      {activeTab === "journal" && <JournalPage />}
      {activeTab === "mandalart" && <MandalartPage />}
    </>
  );
}

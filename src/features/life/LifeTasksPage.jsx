import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import SubPageTabs from "../../components/common/SubPageTabs";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, updateTodo } from "../../lib/storage/localStorageAdapter";
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

function LifeTaskTabs() {
  return (
    <SubPageTabs
      items={[
        { key: "overview", label: "개요", to: "/life" },
        { key: "tasks", label: "전체 할 일", active: true },
        { key: "chores", label: "집안일", to: "/life" },
        { key: "habits", label: "습관", to: "/habits" },
        { key: "journal", label: "일기", to: "/journal" },
        { key: "mandalart", label: "만다라트", to: "/mandalart" }
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
  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <GlassCard className="p-4">
      <SectionTitle>{monthLabel} 요약</SectionTitle>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-clover-sub">
        {["월", "화", "수", "목", "금", "토", "일"].map((day) => <span key={day}>{day}</span>)}
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
              className={`min-h-14 rounded-2xl p-1.5 text-left transition ${
                isSelected ? "bg-clover-deep text-white" : cell.inMonth ? "bg-white/65 text-clover-text hover:bg-white" : "bg-white/25 text-clover-sub"
              }`}
            >
              <span className="text-xs font-black">{cell.day}</span>
              {!!items.length && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {items.slice(0, 4).map((item, index) => (
                    <span key={`${item.type}-${item.id || index}`} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : item.type === "payment" || item.type === "expense" ? "bg-rose-400" : item.type === "todo" ? "bg-sky-400" : "bg-emerald-400"}`} />
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

  return (
    <GlassCard className="p-4">
      <SectionTitle>{selectedDate.slice(5)} 전체 할 일</SectionTitle>
      <div className="grid gap-2">
        {allItems.map((item, index) => (
          <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl bg-white/65 px-3 py-2 text-sm">
            {item.type === "todo" ? (
              <input type="checkbox" checked={Boolean(item.completed)} onChange={(event) => toggleTodo(item, event.target.checked)} className="h-4 w-4 accent-clover-deep" />
            ) : (
              <span className="h-4 w-4 rounded-full bg-clover-mint" />
            )}
            <div className="min-w-0">
              <p className="truncate font-black">{item.displayTitle}</p>
              {(item.time || item.startTime || item.dueTime) && <p className="text-[11px] font-bold text-clover-sub">{item.time || item.startTime || item.dueTime}</p>}
            </div>
            <StatusBadge tone={typeTone[item.type] || "mint"}>{typeLabel[item.type] || item.label || "기록"}</StatusBadge>
          </article>
        ))}
        {!allItems.length && <p className="rounded-2xl bg-white/55 p-4 text-sm font-bold text-clover-sub">이 날짜에는 아직 항목이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

export default function LifeTasksPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(getAllData());
  const selectedDate = params.get("date") || toDateKey(new Date());

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const dayItems = useMemo(() => getTodayItems(data, selectedDate), [data, selectedDate]);
  const selectDate = (date) => setParams({ date });

  return (
    <>
      <PageHeader eyebrow="LIFE" title="전체 할 일">
        <Link to="/" className="rounded-full bg-white/70 px-4 py-2 text-sm font-black text-clover-deep shadow-sm">Home</Link>
      </PageHeader>

      <LifeTaskTabs />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <MonthSummaryCalendar data={data} selectedDate={selectedDate} onSelect={selectDate} />
        <div className="grid gap-4 xl:grid-cols-2">
          <DayTaskList items={dayItems} data={data} selectedDate={selectedDate} onChange={load} />
          <GlassCard className="p-4">
            <SectionTitle>타임라인</SectionTitle>
            <TodayTimeline items={dayItems} />
          </GlassCard>
        </div>
      </div>
    </>
  );
}

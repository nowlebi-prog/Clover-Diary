import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import HomeMonthCalendar from "../home/components/HomeMonthCalendar";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems, getTodayItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

export default function SchedulePage() {
  const today = toDateKey(new Date());
  const [data, setData] = useState(getAllData());
  const [selectedDate, setSelectedDate] = useState(today);
  const initial = new Date(`${selectedDate}T00:00:00`);
  const [calendarMonth, setCalendarMonth] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const load = () => setData(getAllData());
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
        <Link to={`/life?tab=todos&date=${selectedDate}`}><AppButton variant="soft">이 날짜 전체 할일</AppButton></Link>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
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

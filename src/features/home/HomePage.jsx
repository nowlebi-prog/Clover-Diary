import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import HabitCircleSummary from "../../components/habits/HabitCircleSummary";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import WeeklyStripCalendar from "../../components/dashboard/WeeklyStripCalendar";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData, toggleHabitLog, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { toDateKey } from "../../lib/utils/date";
import { getIncompleteTodos, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import TodayFocusPanel from "./components/TodayFocusPanel";
import TodaySummaryGrid from "./components/TodaySummaryGrid";
import TodayTopThree from "./components/TodayTopThree";

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const [reflection, setReflection] = useState("");
  const today = toDateKey(new Date());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const todayItems = getTodayItems(data, today);
  const incomplete = getIncompleteTodos(data);
  const deadlines = getUpcomingDeadlines(data, today);
  const delayed = (data.todos || []).filter((todo) => !todo.completed && Number(todo.delayedCount || 0) > 0);
  const habitStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const shopping = (data.shoppingItems || []).filter((item) => !item.completed);
  const monthKey = today.slice(0, 7);
  const monthExpenses = (data.expenses || [])
    .filter((item) => (item.date || "").startsWith(monthKey))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && item.status !== "입금 완료");
  const todayReflection = useMemo(
    () => (data.reflections || []).find((item) => item.date === today),
    [data.reflections, today]
  );

  const saveReflection = () => {
    const body = reflection.trim();
    if (!body) return;
    const next = getAllData();
    const current = next.reflections || [];
    next.reflections = [
      { id: todayReflection?.id || `reflection-${Date.now()}`, date: today, title: "오늘 배운 한 줄", body, memo: body, createdAt: today, updatedAt: today },
      ...current.filter((item) => item.date !== today)
    ];
    saveAllData(next);
    setReflection("");
  };

  return (
    <>
      <PageHeader eyebrow={today} title="HOME">
        <div className="flex flex-wrap items-center gap-2">
          <WeatherCard />
          <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "memo" }))}>빠른 메모</AppButton>
          <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">
        Life, Work, Money의 오늘 상태를 한눈에 보는 개인 현황판이에요.
      </p>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Link to="/life" className="glass rounded-[22px] bg-white/62 p-4 transition hover:bg-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Life</p>
            <span className="rounded-full bg-clover-mint px-3 py-1 text-xs font-black text-clover-deep">{habitStatus.doneCount}/{habitStatus.total}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">오늘 루틴 체크</p>
          <div className="mt-3 h-2 rounded-full bg-white/70">
            <div className="h-2 rounded-full bg-clover-deep" style={{ width: `${habitStatus.rate}%` }} />
          </div>
        </Link>
        <Link to="/work" className="glass rounded-[22px] bg-white/62 p-4 transition hover:bg-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Work</p>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">{getTodayItems(data, today).length}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">오늘 할 일과 마감</p>
          <p className="mt-2 text-xs font-bold text-clover-sub">남은 업무 {incomplete.length}개</p>
        </Link>
        <Link to="/money" className="glass rounded-[22px] bg-white/62 p-4 transition hover:bg-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Money</p>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">{todayPayments.length}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">이번 달 지출 {monthExpenses.toLocaleString()}원</p>
          <p className="mt-2 text-xs font-bold text-clover-sub">오늘 결제 예정 {todayPayments.length}건</p>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <WeeklyStripCalendar data={data} today={today} />
          <TodayTopThree items={data.top3} onToggle={(id, completed) => updateTop3(id, { completed })} />

          <GlassCard className="p-5">
            <SectionTitle>오늘 일정 / 타임블록</SectionTitle>
            <TodayTimeline items={todayItems} />
          </GlassCard>
        </div>

        <TodayFocusPanel
          incomplete={incomplete}
          deadlines={deadlines}
          delayed={delayed}
          today={today}
          onToggleTodo={(id, completed) => updateTodo(id, { completed, completedAt: completed ? today : "" })}
          onUpdateTodo={(id, updates) => updateTodo(id, updates)}
        />
      </div>

      <TodaySummaryGrid
        habitStatus={habitStatus}
        habitCircle={<HabitCircleSummary habits={data.habits} logs={data.habitLogs} onToggle={(id) => toggleHabitLog(id, today)} />}
        shopping={shopping}
        memos={data.inboxMemos}
        reflection={reflection}
        setReflection={setReflection}
        todayReflection={todayReflection}
        onSaveReflection={saveReflection}
      />
    </>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionLink from "../../components/dashboard/SectionLink";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import WeeklyStripCalendar from "../../components/dashboard/WeeklyStripCalendar";
import DeadlineProjectsCard from "../../components/dashboard/DeadlineProjectsCard";
import BudgetSummaryCard from "../../components/dashboard/BudgetSummaryCard";
import ProjectsProgressCard from "../../components/dashboard/ProjectsProgressCard";
import TodayRoutineCard from "../../components/dashboard/TodayRoutineCard";
import PageHeader from "../../components/layout/PageHeader";
import TodayFocusPanel from "./components/TodayFocusPanel";
import TodayTopThree from "./components/TodayTopThree";
import { getAllData, updateTodo, toggleHabitLog } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { toDateKey } from "../../lib/utils/date";
import { fmtHM } from "../../lib/utils/workUtils";
import {
  getTodayItems,
  getIncompleteTodos,
  getUpcomingDeadlines,
  getHomeTop3,
  getDeadlineProjects,
  getProjectsProgress,
  getBudgetSummary,
  getTodayRoutines,
  getWorkSummary
} from "../../lib/utils/dashboardSelectors";

export default function HomePage() {
  const [data, setData] = useState(getAllData());
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
  const monthKey = today.slice(0, 7);
  const monthExpenses = (data.expenses || [])
    .filter((item) => (item.date || "").startsWith(monthKey))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && item.status !== "입금 완료");
  const workSummary = getWorkSummary(data, today);

  const top3 = getHomeTop3(data).map((todo) => ({
    ...todo,
    onToggle: (completed) => updateTodo(todo.id, { completed, completedAt: completed ? today : "" })
  }));
  const deadlineProjects = getDeadlineProjects(data, today);
  const projectsProgress = getProjectsProgress(data, today);
  const budgetSummary = getBudgetSummary(data, today);
  const routines = getTodayRoutines(data, today);

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
        <Link to="/life" className="glass rounded-[22px] border border-emerald-100 bg-emerald-50/75 p-4 transition hover:bg-emerald-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Life</p>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{habitStatus.doneCount}/{habitStatus.total}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">오늘 루틴 체크</p>
          <div className="mt-3 h-2 rounded-full bg-white/70">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${habitStatus.rate}%` }} />
          </div>
        </Link>
        <Link to="/work" className="glass rounded-[22px] border border-sky-100 bg-sky-50/75 p-4 transition hover:bg-sky-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Work</p>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">{todayItems.length}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">
            {workSummary.active ? `지금 "${workSummary.active.title}" 진행 중` : "오늘 할 일과 마감"}
          </p>
          <p className="mt-2 text-xs font-bold text-clover-sub">오늘 작업 {fmtHM(workSummary.todaySec)} · 남은 업무 {incomplete.length}개</p>
        </Link>
        <Link to="/money" className="glass rounded-[22px] border border-amber-100 bg-amber-50/75 p-4 transition hover:bg-amber-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Money</p>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">{todayPayments.length}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-clover-ink">이번 달 지출 {monthExpenses.toLocaleString()}원</p>
          <p className="mt-2 text-xs font-bold text-clover-sub">오늘 결제 예정 {todayPayments.length}건</p>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-4">
          <TodayTopThree items={top3} />

          <WeeklyStripCalendar data={data} today={today} />

          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-bold text-clover-text">오늘 일정 / 타임블록</h2>
              <SectionLink to="/daily" />
            </div>
            <TodayTimeline items={todayItems} />
          </GlassCard>

          <DeadlineProjectsCard projects={deadlineProjects} />

          <BudgetSummaryCard summary={budgetSummary} />

          <ProjectsProgressCard projects={projectsProgress} />

          <TodayRoutineCard routines={routines} onToggle={(habitId) => toggleHabitLog(habitId, today)} />
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
    </>
  );
}

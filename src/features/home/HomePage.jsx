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
import TodayTopThree from "./components/TodayTopThree";
import { getAllData, updateTodo, toggleHabitLog } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import {
  getTodayItems,
  getHomeTop3,
  getDeadlineProjects,
  getProjectsProgress,
  getBudgetSummary,
  getTodayRoutines
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
  const top3 = getHomeTop3(data).map((todo) => ({
    ...todo,
    onToggle: (completed) => updateTodo(todo.id, { completed, completedAt: completed ? today : "" })
  }));
  const deadlineProjects = getDeadlineProjects(data, today);
  const projectsProgress = getProjectsProgress(data, today);
  const budgetSummary = getBudgetSummary(data, today);
  const routines = getTodayRoutines(data, today);

  const doneToday = top3.filter((item) => item.completed).length;
  const statusLine = top3.length
    ? `오늘은 ${top3.length}개 중 ${doneToday}개 끝냈어요. 나머지도 가볍게 가볼까요?`
    : "오늘은 마음 편하게 정리해봐요.";

  return (
    <>
      <PageHeader eyebrow={today} title="HOME">
        <div className="flex flex-wrap items-center gap-2">
          <WeatherCard />
          <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "memo" }))}>빠른 메모</AppButton>
          <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-4 text-sm font-bold text-clover-sub">{statusLine}</p>

      <div className="grid gap-4">
        <TodayTopThree items={top3} />

        <DeadlineProjectsCard projects={deadlineProjects} />

        <WeeklyStripCalendar data={data} today={today} />

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-clover-text">오늘 일정 / 타임블록</h2>
            <SectionLink to="/daily" />
          </div>
          <TodayTimeline items={todayItems} />
        </GlassCard>

        <BudgetSummaryCard summary={budgetSummary} />

        <ProjectsProgressCard projects={projectsProgress} />

        <TodayRoutineCard routines={routines} onToggle={(habitId, checked) => toggleHabitLog(habitId, today, checked)} />
      </div>
    </>
  );
}

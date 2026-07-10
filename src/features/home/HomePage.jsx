import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
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
      <PageHeader eyebrow={today} title="오늘 대시보드">
        <div className="flex flex-wrap items-center gap-2">
          <WeatherCard />
          <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm text-clover-sub">오늘은 딱 3가지만 끝내도 충분해요.</p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <TodayTopThree items={data.top3} onToggle={(id, completed) => updateTop3(id, { completed })} />

          <GlassCard className="p-5">
            <SectionTitle>오늘 일정 타임라인</SectionTitle>
            <TodayTimeline items={todayItems} />
          </GlassCard>
        </div>

        <TodayFocusPanel
          incomplete={incomplete}
          deadlines={deadlines}
          delayed={delayed}
          today={today}
          onToggleTodo={(id, completed) => updateTodo(id, { completed, completedAt: completed ? today : "" })}
        />
      </div>

      <TodaySummaryGrid
        habitStatus={habitStatus}
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

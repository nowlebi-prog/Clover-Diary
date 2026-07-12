import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import SubPageTabs from "../../components/common/SubPageTabs";
import PageHeader from "../../components/layout/PageHeader";
import HabitFormModal from "../../components/habits/HabitFormModal";
import HabitMonthView from "../../components/habits/HabitMonthView";
import HabitTodayCard from "../../components/habits/HabitTodayCard";
import HabitWeekView from "../../components/habits/HabitWeekView";
import HabitYearHeatmap from "../../components/habits/HabitYearHeatmap";
import {
  createHabit,
  deleteHabit,
  getAllData,
  toggleHabitLog,
  updateHabit
} from "../../lib/storage/localStorageAdapter";
import {
  addDays,
  getActiveHabits,
  getPausedHabits,
  getTodayHabitStatus,
  getWeeklyHabitStats,
  startOfWeek,
  toDateKey
} from "../../lib/utils/habitSelectors";

const tabs = [
  ["today", "Today"],
  ["week", "This week"],
  ["month", "This month"],
  ["year", "Year"],
  ["paused", "Paused"]
];

const newHabit = { name: "", icon: "CL", color: "#8DDFA8", frequencyType: "daily", targetCount: 7, customDays: [], memo: "", status: "active" };

export default function HabitsPage() {
  const [data, setData] = useState(getAllData());
  const [tab, setTab] = useState("today");
  const [editing, setEditing] = useState(null);
  const now = new Date();
  const today = toDateKey(now);

  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", () => setEditing(newHabit));
    return () => {
      window.removeEventListener("clover-data-change", load);
      window.removeEventListener("clover-quick-add", () => setEditing(newHabit));
    };
  }, []);

  const activeHabits = useMemo(() => getActiveHabits(data.habits), [data.habits]);
  const pausedHabits = useMemo(() => getPausedHabits(data.habits), [data.habits]);
  const todayStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const weekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthDays = Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }, (_, index) => toDateKey(new Date(now.getFullYear(), now.getMonth(), index + 1)));
  const weeklyStats = getWeeklyHabitStats(data.habits, data.habitLogs, today);
  const weekRate = weeklyStats.length ? Math.round(weeklyStats.reduce((sum, item) => sum + item.rate, 0) / weeklyStats.length) : 0;
  const monthDone = activeHabits.reduce((sum, habit) => sum + monthDays.filter((day) => data.habitLogs.some((log) => log.habitId === habit.id && log.date === day && log.completed)).length, 0);
  const monthTotal = activeHabits.length * monthDays.length;
  const monthRate = monthTotal ? Math.round((monthDone / monthTotal) * 100) : 0;
  const maxStreak = Math.max(0, ...todayStatus.habits.map((habit) => habit.streak));

  const saveHabit = (habit) => {
    if (habit.id) updateHabit(habit.id, habit);
    else createHabit(habit);
    setEditing(null);
    load();
  };

  const removeHabit = (id) => {
    deleteHabit(id);
    setEditing(null);
    load();
  };

  return (
    <>
      <PageHeader eyebrow={today} title="Habit Tracker">
        <AppButton onClick={() => setEditing(newHabit)}>+ Add habit</AppButton>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <GlassCard className="p-4"><p className="text-xs text-clover-sub">Today complete</p><p className="mt-1 text-2xl font-bold">{todayStatus.doneCount}/{todayStatus.total}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-clover-sub">This week</p><p className="mt-1 text-2xl font-bold">{weekRate}%</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-clover-sub">This month</p><p className="mt-1 text-2xl font-bold">{monthRate}%</p></GlassCard>
        <GlassCard className="p-4"><p className="text-xs text-clover-sub">Best streak</p><p className="mt-1 text-2xl font-bold">{maxStreak} days</p></GlassCard>
      </div>

      <SubPageTabs items={tabs.map(([key, label]) => ({ key, label, active: tab === key, onClick: () => setTab(key) }))} />

      {tab === "today" && (
        <GlassCard>
          <SectionTitle action={<StatusBadge tone={todayStatus.rate === 100 ? "done" : "warning"}>{todayStatus.rate}%</StatusBadge>}>Check habits</SectionTitle>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/60">
            <div className="h-full rounded-full bg-clover-deep transition-all" style={{ width: `${todayStatus.rate}%` }} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 thin-scroll md:grid md:grid-cols-2 lg:grid-cols-4">
            {todayStatus.habits.map((habit) => (
              <HabitTodayCard
                key={habit.id}
                habit={habit}
                done={habit.done}
                streak={habit.streak}
                onToggle={() => toggleHabitLog(habit.id, today)}
                onEdit={() => setEditing(habit)}
              />
            ))}
            <button onClick={() => setEditing(newHabit)} className="min-w-[210px] rounded-[24px] border border-dashed border-clover-primary bg-white/35 p-4 text-left font-bold text-clover-deep">+ New habit</button>
          </div>
        </GlassCard>
      )}

      {tab === "week" && <GlassCard><SectionTitle>This week</SectionTitle><HabitWeekView habits={activeHabits} logs={data.habitLogs} days={weekDays} today={now} /></GlassCard>}
      {tab === "month" && <GlassCard><SectionTitle>This month</SectionTitle><HabitMonthView habits={activeHabits} logs={data.habitLogs} days={monthDays} today={now} /></GlassCard>}
      {tab === "year" && <GlassCard><SectionTitle>Year heatmap</SectionTitle><HabitYearHeatmap habits={activeHabits} logs={data.habitLogs} today={now} /></GlassCard>}
      {tab === "paused" && (
        <GlassCard>
          <SectionTitle>Paused or archived</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {pausedHabits.map((habit) => (
              <article key={habit.id} className="rounded-[22px] bg-white/55 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{habit.name}</p>
                  <StatusBadge tone="cream">Paused</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-clover-sub">{habit.memo || "Ready when you are."}</p>
                <AppButton className="mt-4" variant="soft" onClick={() => updateHabit(habit.id, { status: "active" })}>Activate</AppButton>
              </article>
            ))}
            {!pausedHabits.length && <p className="text-sm text-clover-sub">No paused habits right now.</p>}
          </div>
        </GlassCard>
      )}

      <HabitFormModal habit={editing} onClose={() => setEditing(null)} onSave={saveHabit} onDelete={removeHabit} />
    </>
  );
}

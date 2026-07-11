import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import WeeklyStripCalendar from "../../components/dashboard/WeeklyStripCalendar";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { toDateKey } from "../../lib/utils/date";
import { getIncompleteTodos, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import TodayFocusPanel from "./components/TodayFocusPanel";
import TodayTopThree from "./components/TodayTopThree";

const recentDate = (item) => item.updatedAt || item.createdAt || item.date || item.dueDate || item.expectedDate || "";
const recentTitle = (item) => item.title || item.name || item.project || item.body || item.text || item.displayTitle || "기록";

function RecentActivity({ data }) {
  const items = [
    ...(data.todos || []).map((item) => ({ ...item, kind: "Work" })),
    ...(data.events || []).map((item) => ({ ...item, kind: "Plan" })),
    ...(data.habitLogs || []).map((item) => ({ ...item, kind: "Life", title: "습관 체크" })),
    ...(data.inboxMemos || []).map((item) => ({ ...item, kind: "Memo", title: item.body })),
    ...(data.payments || []).map((item) => ({ ...item, kind: "Money" })),
    ...(data.contentPlans || []).map((item) => ({ ...item, kind: "Content" }))
  ]
    .filter((item) => recentDate(item))
    .sort((a, b) => recentDate(b).localeCompare(recentDate(a)))
    .slice(0, 10);

  return (
    <GlassCard className="mt-4">
      <SectionTitle>최근 활동</SectionTitle>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.id || index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold">{recentTitle(item)}</p>
              <p className="mt-1 text-xs font-bold text-clover-sub">{item.kind} · {recentDate(item)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-clover-mint px-2.5 py-1 text-[11px] font-black text-clover-deep">{index + 1}</span>
          </div>
        ))}
        {!items.length && <p className="text-sm text-clover-sub">아직 쌓인 활동이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

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
          <p className="mt-2 text-sm font-bold text-clover-ink">오늘 할 일과 마감</p>
          <p className="mt-2 text-xs font-bold text-clover-sub">남은 업무 {incomplete.length}개</p>
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

      <RecentActivity data={data} />
    </>
  );
}

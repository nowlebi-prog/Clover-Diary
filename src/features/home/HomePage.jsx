import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData, syncAllDataFromCloud, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus, getMonthlyHabitStats } from "../../lib/utils/habitSelectors";
import { toDateKey } from "../../lib/utils/date";
import { getIncompleteTodos, getMonthCalendarItems, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import HomeMonthCalendar from "./components/HomeMonthCalendar";
import TodayTopThree from "./components/TodayTopThree";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const titleOf = (item) => item.title || item.name || item.project || item.body || item.text || item.displayTitle || "기록";
const dateOf = (item) => item.updatedAt || item.createdAt || item.date || item.dueDate || item.expectedDate || "";

function StatCard({ to, label, title, value, note, tone }) {
  const tones = {
    life: "border-emerald-100 bg-emerald-50/80 text-emerald-700",
    work: "border-sky-100 bg-sky-50/80 text-sky-700",
    money: "border-amber-100 bg-amber-50/80 text-amber-700"
  };
  return (
    <Link to={to} className={`glass rounded-[22px] border p-4 transition hover:-translate-y-0.5 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em]">{label}</p>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black">{value}</span>
      </div>
      <p className="mt-2 text-sm font-black text-clover-text">{title}</p>
      <p className="mt-1 text-xs font-bold opacity-75">{note}</p>
    </Link>
  );
}

function HomeDayDetails({ data, selectedDate, onChange }) {
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
      next[item.collection] = (next[item.collection] || []).filter((entry) => entry.id !== item.id);
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
        <div>
          <h3 className="text-base font-black text-slate-900">{selectedDate.slice(5)} 세부항목</h3>
          <p className="text-xs font-bold text-slate-400">이 영역에서 바로 수정, 삭제, 추가해요.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={addTodo} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-deep shadow-sm">+ 할 일</button>
          <button type="button" onClick={addEvent} className="rounded-full bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-sm">+ 일정</button>
        </div>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <div key={`${item.collection}-${item.id}`} className="grid gap-2 rounded-2xl bg-white/80 p-3 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex items-center gap-2">
              {item.collection === "todos" && <input type="checkbox" checked={Boolean(item.completed)} onChange={(event) => updateItem(item, { completed: event.target.checked, completedAt: event.target.checked ? selectedDate : "" })} />}
              <StatusBadge tone={item.collection === "payments" || item.collection === "expenses" ? "danger" : item.collection === "events" ? "mint" : "blue"}>{item.typeLabel}</StatusBadge>
            </div>
            <input
              className="min-h-10 rounded-2xl border border-transparent bg-white/70 px-3 text-sm font-bold outline-none focus:border-clover-primary"
              value={item[item.field] || ""}
              onChange={(event) => updateItem(item, { [item.field]: event.target.value })}
            />
            <button type="button" onClick={() => deleteItem(item)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-500">
              삭제
            </button>
          </div>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/70 p-4 text-sm font-bold text-clover-sub">이 날짜에는 아직 항목이 없어요. 바로 추가해도 됩니다.</p>}
      </div>
    </div>
  );
}

function MonthlyMoodSleep({ entries, today }) {
  const monthKey = today.slice(0, 7);
  const monthEntries = (entries || []).filter((item) => (item.date || "").startsWith(monthKey)).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <GlassCard>
      <SectionTitle>이달의 기분 · 수면</SectionTitle>
      <div className="flex h-40 items-end gap-2 overflow-x-auto rounded-[24px] bg-white/45 p-4">
        {monthEntries.map((item) => (
          <div key={item.id || item.date} className="flex min-w-8 flex-col items-center justify-end gap-1">
            <span className="grid h-7 w-7 place-items-center rounded-[35%] text-sm font-black" style={{ background: item.color || "#E7F0EA" }}>{item.emoji || "·"}</span>
            <span className="w-2 rounded-full bg-teal-400" style={{ height: `${Math.max(8, Number(item.score || 0) * 18)}px` }} />
            <span className="w-2 rounded-full bg-sky-300" style={{ height: `${Math.max(6, Number(item.sleepHours || 0) * 6)}px` }} />
            <span className="text-[10px] font-bold text-clover-sub">{Number(item.date.slice(-2))}</span>
          </div>
        ))}
        {!monthEntries.length && <p className="self-center text-sm font-bold text-clover-sub">아직 이달 기록이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function RoutineCircle({ data, today }) {
  const now = new Date(`${today}T00:00:00`);
  const stats = getMonthlyHabitStats(data.habits || [], data.habitLogs || [], now.getFullYear(), now.getMonth());
  const done = stats.reduce((sum, item) => sum + item.doneDays.length, 0);
  const total = stats.reduce((sum, item) => sum + item.days.length, 0);
  const rate = total ? Math.round((done / total) * 100) : 0;
  return (
    <GlassCard>
      <SectionTitle>오늘 루틴 달성률</SectionTitle>
      <div className="grid place-items-center gap-3">
        <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#35A06D ${rate * 3.6}deg, rgba(255,255,255,.72) 0deg)` }}>
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
            <b className="text-3xl">{rate}%</b>
            <span className="text-xs font-bold text-clover-sub">{done}/{total}</span>
          </div>
        </div>
        <Link to="/life" className="rounded-full bg-white/70 px-4 py-2 text-sm font-black text-clover-deep">습관 보러가기</Link>
      </div>
    </GlassCard>
  );
}

function BudgetPreview({ data, today }) {
  const monthKey = today.slice(0, 7);
  const incomeCount = (data.payments || []).filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey)).length;
  const expenseCount = (data.expenses || []).filter((item) => (item.date || "").startsWith(monthKey)).length;
  const upcomingPayments = (data.payments || []).filter((item) => item.expectedDate >= today && item.status !== "입금 완료").length;
  return (
    <GlassCard>
      <SectionTitle action={<Link to="/money" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">Money</Link>}>돈관리 요약</SectionTitle>
      <p className="mb-3 text-xs font-bold text-clover-sub">Home에서는 민감한 금액을 직접 보여주지 않아요.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black text-emerald-700">수입 기록</p><b>{incomeCount}건</b></div>
        <div className="rounded-2xl bg-rose-50 p-4"><p className="text-xs font-black text-rose-700">지출 기록</p><b>{expenseCount}건</b></div>
        <div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-black text-amber-700">확인할 결제</p><b>{upcomingPayments}건</b></div>
      </div>
    </GlassCard>
  );
}

function RecentActivity({ data }) {
  const items = [
    ...(data.todos || []).map((item) => ({ ...item, kind: "Work" })),
    ...(data.events || []).map((item) => ({ ...item, kind: "Plan" })),
    ...(data.habitLogs || []).map((item) => ({ ...item, kind: "Life", title: "습관 체크" })),
    ...(data.inboxMemos || []).map((item) => ({ ...item, kind: "Memo", title: item.body })),
    ...(data.payments || []).map((item) => ({ ...item, kind: "Money" })),
    ...(data.reflections || []).map((item) => ({ ...item, kind: "Journal", title: item.body || item.memo }))
  ].filter((item) => dateOf(item)).sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(0, 10);

  return (
    <GlassCard>
      <SectionTitle>최근 활동</SectionTitle>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.id || index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold">{titleOf(item)}</p>
              <p className="mt-1 text-xs font-bold text-clover-sub">{item.kind} · {dateOf(item)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-clover-mint px-2.5 py-1 text-[11px] font-black text-clover-deep">{index + 1}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const now = new Date(`${today}T00:00:00`);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const refreshNow = async () => {
    await syncAllDataFromCloud();
    load();
  };

  const todayItems = getTodayItems(data, today);
  const incomplete = getIncompleteTodos(data);
  const deadlines = getUpcomingDeadlines(data, today);
  const habitStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const monthItems = useMemo(() => getMonthCalendarItems(data, calendarMonth.year, calendarMonth.month), [data, calendarMonth]);
  const closeDeadlines = deadlines.filter((item) => item.dday <= 7).slice(0, 5);
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && item.status !== "입금 완료");

  return (
    <>
      <PageHeader eyebrow={today} title="오늘의 현황">
        <div className="flex flex-wrap items-center gap-2">
          <WeatherCard />
          <AppButton variant="soft" onClick={refreshNow}>새로고침</AppButton>
          <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "memo" }))}>빠른 메모</AppButton>
          <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <StatCard to="/life" label="Life" title="오늘 루틴 체크" value={`${habitStatus.doneCount}/${habitStatus.total}`} note="습관과 컨디션 기록" tone="life" />
        <StatCard to="/work" label="Work" title="오늘 일정과 마감" value={todayItems.length} note={`남은 업무 ${incomplete.length}건`} tone="work" />
        <StatCard to="/money" label="Money" title="돈관리 잠금" value={todayPayments.length} note={`오늘 확인할 결제 ${todayPayments.length}건`} tone="money" />
      </div>

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
          setSelectedDate(today);
          setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
        }}
      >
        <HomeDayDetails data={data} selectedDate={selectedDate} onChange={load} />
      </HomeMonthCalendar>

      <GlassCard className="mt-4">
        <SectionTitle action={<Link to="/work" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">Work</Link>}>오늘 일정 / 타임라인</SectionTitle>
        <TodayTimeline items={todayItems} />
      </GlassCard>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TodayTopThree items={data.top3} onToggle={(id, completed) => updateTop3(id, { completed })} />
        <GlassCard>
          <SectionTitle>마감 임박</SectionTitle>
          <div className="grid gap-2">
            {closeDeadlines.map((item, index) => (
              <Link key={`${item.type}-${item.id || index}`} to={item.type === "payment" ? "/money" : item.type === "content" ? "/content" : "/tasks"} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3 text-sm font-bold">
                <span className="truncate">{item.displayTitle}</span>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-rose-600">D{item.dday >= 0 ? `-${item.dday}` : `+${Math.abs(item.dday)}`}</span>
              </Link>
            ))}
            {!closeDeadlines.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">급한 마감은 없어요.</p>}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <MonthlyMoodSleep entries={data.moodEntries || []} today={today} />
        <RoutineCircle data={data} today={today} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <BudgetPreview data={data} today={today} />
        <RecentActivity data={data} />
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData, syncAllDataFromCloud, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { addDays, toDateKey } from "../../lib/utils/date";
import { getMonthCalendarItems, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import HomeMonthCalendar from "./components/HomeMonthCalendar";
import TodayTopThree from "./components/TodayTopThree";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const titleOf = (item) => item.title || item.name || item.project || item.body || item.text || item.displayTitle || "기록";
const dateOf = (item) => item.updatedAt || item.createdAt || item.date || item.dueDate || item.expectedDate || "";

const money = (value) => `${Number(value || 0).toLocaleString("ko-KR")}원`;

const mergeCalendarItems = (data, dates) => {
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  return months.reduce((merged, monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return { ...merged, ...getMonthCalendarItems(data, year, month - 1) };
  }, {});
};

const scheduleCategoryOf = (item) => {
  const raw = `${item.category || item.project || item.kind || item.type || ""}`.toLowerCase();
  if (item.type === "payment" || item.type === "expense" || raw.includes("money") || raw.includes("돈")) return "결제";
  if (raw.includes("업무") || raw.includes("work") || raw.includes("콘텐츠") || raw.includes("캠페인")) return "업무";
  return "개인";
};

function TodaySummary({ todayItems, deadlines, payments, chores, habitStatus, studyDue }) {
  const scheduleCounts = todayItems.reduce((map, item) => {
    const key = scheduleCategoryOf(item);
    return { ...map, [key]: (map[key] || 0) + 1 };
  }, {});
  const summary = [
    {
      to: "/calendar",
      label: "오늘의 일정",
      value: `${todayItems.length}개`,
      note: `개인 ${scheduleCounts["개인"] || 0} · 업무 ${scheduleCounts["업무"] || 0} · 결제 ${scheduleCounts["결제"] || 0}`,
      tone: "bg-emerald-50/85 text-emerald-700",
      wide: true
    },
    { to: "/tasks", label: "마감", value: `${deadlines.length}건`, note: deadlines[0]?.displayTitle || "급한 마감 없음", tone: "bg-sky-50/85 text-sky-700" },
    { to: "/money", label: "결제", value: `${payments.length}건`, note: payments[0]?.project || "확인할 결제 없음", tone: "bg-rose-50/85 text-rose-700" },
    { to: "/life", label: "집안일", value: `${chores.length}건`, note: chores[0]?.title || "오늘 집안일 없음", tone: "bg-violet-50/85 text-violet-700" },
    {
      to: "/life",
      label: "루틴",
      value: `${habitStatus.rate || 0}%`,
      note: `${habitStatus.doneCount}/${habitStatus.total}개 완료`,
      tone: "bg-emerald-50/85 text-emerald-700"
    },
    { to: "/study", label: "스터디", value: `${studyDue.length}개`, note: studyDue[0]?.title || "오늘 복습 없음", tone: "bg-amber-50/85 text-amber-700" }
  ];

  return (
    <GlassCard className="mb-4">
      <SectionTitle>오늘의 요약!</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summary.map((item) => (
          <Link key={item.label} to={item.to} className={`rounded-[22px] p-4 transition hover:-translate-y-0.5 ${item.tone} ${item.wide ? "md:col-span-3 xl:col-span-2" : ""}`}>
            <p className="text-xs font-black">{item.label}</p>
            <p className="mt-2 text-xl font-black text-clover-text">{item.value}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold opacity-75">{item.note}</p>
          </Link>
        ))}
      </div>
    </GlassCard>
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
      moveToTrash(next, item.collection, item);
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
          <h3 className="text-base font-black text-slate-900">{selectedDate.slice(5)} To do</h3>
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
  const monthEntries = (entries || []).filter((item) => item.date && item.date.startsWith(monthKey)).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <GlassCard>
      <SectionTitle>월의 나</SectionTitle>
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

function StudyPreview({ data, today }) {
  const items = (data.studyCaptures || [])
    .filter((item) => !item.isReviewed || item.reviewSchedule?.nextReviewAt <= today || item.status === "waiting")
    .slice(0, 3);
  return (
    <GlassCard>
      <SectionTitle action={<Link to="/study" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">Study</Link>}>오늘의 스터디</SectionTitle>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link key={item.id} to="/study" className="rounded-2xl bg-white/55 p-3 text-sm font-bold">
            <span className="line-clamp-2">{item.title}</span>
            <span className="mt-1 block text-xs text-clover-sub">오늘 다시 볼 캡처</span>
          </Link>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 다시 볼 캡처는 없어요.</p>}
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
          <div key={`${item.kind}-${item.id || index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white/55 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="line-clamp-2 break-words font-bold leading-5">{titleOf(item)}</p>
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
  const deadlines = getUpcomingDeadlines(data, today);
  const habitStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const calendarDates = useMemo(() => Array.from({ length: 21 }, (_, index) => addDays(today, index - 7)), [today]);
  const monthItems = useMemo(() => mergeCalendarItems(data, calendarDates), [data, calendarDates]);
  const closeDeadlines = deadlines.filter((item) => item.dday <= 7).slice(0, 5);
  const todayDeadlines = deadlines.filter((item) => item.dday === 0);
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && item.status !== "입금 완료");
  const todayChores = (data.chores || []).filter((item) => item.lastDoneAt !== today && (!item.nextDueDate || item.nextDueDate <= today));
  const studyDue = (data.studyCaptures || []).filter((item) => !item.isReviewed || item.reviewSchedule?.nextReviewAt <= today || item.status === "waiting");

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

      <TodaySummary todayItems={todayItems} deadlines={todayDeadlines} payments={todayPayments} chores={todayChores} habitStatus={habitStatus} studyDue={studyDue} />

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <TodayTopThree items={data.top3} todos={data.todos || []} onToggle={(id, completed) => updateTop3(id, { completed })} />
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
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
        <GlassCard>
          <HomeDayDetails data={data} selectedDate={selectedDate} onChange={load} />
        </GlassCard>
        <GlassCard>
          <SectionTitle action={<Link to="/work" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">Work</Link>}>타임라인</SectionTitle>
          <TodayTimeline items={todayItems} />
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <MonthlyMoodSleep entries={data.moodEntries || []} today={today} />
        <RecentActivity data={data} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <BudgetPreview data={data} today={today} />
        <StudyPreview data={data} today={today} />
      </div>
    </>
  );
}

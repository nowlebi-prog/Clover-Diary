import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import WeatherCard from "../../components/dashboard/WeatherCard";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, syncAllDataFromCloud, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { addDays, toDateKey } from "../../lib/utils/date";
import { getMonthCalendarItems, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import HomeMonthCalendar from "./components/HomeMonthCalendar";
import TodayTopThree from "./components/TodayTopThree";

const titleOf = (item) => item.title || item.name || item.project || item.body || item.text || item.displayTitle || "기록";
const dateOf = (item) => item.updatedAt || item.createdAt || item.date || item.dueDate || item.expectedDate || "";
const isPaid = (item) => ["입금 완료", "paid", "done", "완료"].includes(String(item.status || "").toLowerCase());

const mergeCalendarItems = (data, dates) => {
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  return months.reduce((merged, monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    return { ...merged, ...getMonthCalendarItems(data, year, month - 1) };
  }, {});
};

const scheduleCategoryOf = (item) => {
  const raw = `${item.category || item.project || item.kind || item.type || ""}`.toLowerCase();
  if (item.type === "payment" || item.type === "expense" || raw.includes("money") || raw.includes("결제") || raw.includes("돈")) return "결제";
  if (raw.includes("업무") || raw.includes("work") || raw.includes("content") || raw.includes("campaign")) return "업무";
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
      tone: "bg-emerald-50 text-emerald-700"
    },
    { to: "/tasks", label: "마감", value: `${deadlines.length}건`, note: deadlines[0]?.displayTitle || "오늘 마감 없음", tone: "bg-sky-50 text-sky-700" },
    { to: "/money", label: "결제", value: `${payments.length}건`, note: payments[0]?.project || "확인할 결제 없음", tone: "bg-rose-50 text-rose-700" },
    { to: "/life", label: "집안일", value: `${chores.length}건`, note: chores[0]?.title || "오늘 집안일 없음", tone: "bg-violet-50 text-violet-700" },
    { to: "/life", label: "루틴", value: `${habitStatus.rate || 0}%`, note: `${habitStatus.doneCount}/${habitStatus.total}개 완료`, tone: "bg-emerald-50 text-emerald-700" },
    { to: "/study", label: "스터디", value: `${studyDue.length}개`, note: studyDue[0]?.title || "오늘 복습 없음", tone: "bg-amber-50 text-amber-700" }
  ];

  return (
    <GlassCard className="mb-4 overflow-hidden">
      <SectionTitle>오늘의 요약!</SectionTitle>
      <div className="flex gap-3 overflow-x-auto pb-1 thin-scroll">
        {summary.map((item) => (
          <Link key={item.label} to={item.to} className={`min-w-[132px] flex-1 rounded-[20px] px-4 py-3 transition hover:-translate-y-0.5 ${item.tone}`}>
            <p className="text-[11px] font-black">{item.label}</p>
            <p className="mt-1 text-xl font-black text-clover-text">{item.value}</p>
            <p className="mt-1 truncate text-[11px] font-bold opacity-75">{item.note}</p>
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}

function MonthlyMoodSleep({ entries, today }) {
  const monthKey = today.slice(0, 7);
  const monthEntries = (entries || []).filter((item) => item.date && item.date.startsWith(monthKey)).sort((a, b) => a.date.localeCompare(b.date));
  const maxScore = Math.max(5, ...monthEntries.map((item) => Number(item.score || 0)));
  const maxSleep = Math.max(8, ...monthEntries.map((item) => Number(item.sleepHours || 0)));
  return (
    <GlassCard>
      <SectionTitle>월의 나</SectionTitle>
      <div className="flex h-36 items-end gap-2 overflow-x-auto rounded-[22px] bg-white/45 p-3">
        {monthEntries.map((item) => {
          const moodHeight = Math.max(8, (Number(item.score || 0) / maxScore) * 78);
          const sleepHeight = Math.max(6, (Number(item.sleepHours || 0) / maxSleep) * 78);
          return (
            <div key={item.id || item.date} className="flex min-w-8 flex-col items-center justify-end gap-1">
              <span className="grid h-6 w-6 place-items-center rounded-[35%] text-xs font-black" style={{ background: item.color || "#E7F0EA" }}>{item.emoji || "•"}</span>
              <div className="flex h-20 items-end gap-1">
                <span className="w-2 rounded-full bg-teal-400" style={{ height: `${moodHeight}px` }} title="기분" />
                <span className="w-2 rounded-full bg-sky-300" style={{ height: `${sleepHeight}px` }} title="수면" />
              </div>
              <span className="text-[10px] font-bold text-clover-sub">{Number(item.date.slice(-2))}</span>
            </div>
          );
        })}
        {!monthEntries.length && <p className="self-center text-sm font-bold text-clover-sub">아직 이달 기분/수면 기록이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function BudgetPreview({ data, today }) {
  const monthKey = today.slice(0, 7);
  const incomeCount = (data.payments || []).filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey)).length;
  const expenseCount = (data.expenses || []).filter((item) => (item.date || "").startsWith(monthKey)).length;
  const upcomingPayments = (data.payments || []).filter((item) => item.expectedDate >= today && !isPaid(item)).length;
  return (
    <GlassCard>
      <SectionTitle action={<Link to="/money" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">Money</Link>}>돈관리 요약</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[11px] font-black text-emerald-700">수입 기록</p><b>{incomeCount}건</b></div>
        <div className="rounded-2xl bg-rose-50 p-3"><p className="text-[11px] font-black text-rose-700">지출 기록</p><b>{expenseCount}건</b></div>
        <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[11px] font-black text-amber-700">확인할 결제</p><b>{upcomingPayments}건</b></div>
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
            <span className="line-clamp-1">{item.title}</span>
            <span className="mt-1 block text-xs text-clover-sub">오늘 다시 볼 캡쳐</span>
          </Link>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/45 p-3 text-sm font-bold text-clover-sub">오늘 다시 볼 캡쳐가 없어요.</p>}
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
  ].filter((item) => dateOf(item)).sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(0, 25);

  return (
    <GlassCard>
      <SectionTitle>최근 활동</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.id || index}`} className="min-w-0 rounded-2xl bg-white/55 px-3 py-2 text-xs">
            <p className="truncate font-black">{titleOf(item)}</p>
            <p className="mt-1 truncate font-bold text-clover-sub">{item.kind} · {dateOf(item)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const navigate = useNavigate();

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
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && !isPaid(item));
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
              <Link key={`${item.type}-${item.id || index}`} to={item.type === "payment" ? "/money" : item.type === "content" || item.type === "campaign" ? "/archive" : "/tasks"} className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3 text-sm font-bold">
                <span className="truncate">{item.displayTitle}</span>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-rose-600">D{item.dday >= 0 ? `-${item.dday}` : `+${Math.abs(item.dday)}`}</span>
              </Link>
            ))}
            {!closeDeadlines.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">급한 마감은 없어요.</p>}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <HomeMonthCalendar
          itemsByDate={monthItems}
          selectedDate={today}
          onSelectDate={(date) => navigate(`/life/tasks?date=${date}`)}
          onToday={() => navigate(`/life/tasks?date=${today}`)}
        />
        <GlassCard>
          <SectionTitle action={<Link to={`/life/tasks?date=${today}`} className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">전체</Link>}>타임라인</SectionTitle>
          <TodayTimeline items={todayItems} />
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <MonthlyMoodSleep entries={data.moodEntries || []} today={today} />
        <BudgetPreview data={data} today={today} />
      </div>

      <div className="mt-4">
        <StudyPreview data={data} today={today} />
      </div>

      <div className="mt-4">
        <RecentActivity data={data} />
      </div>
    </>
  );
}

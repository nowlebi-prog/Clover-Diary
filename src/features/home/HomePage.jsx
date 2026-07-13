import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import WeatherCard from "../../components/dashboard/WeatherCard";
import QuickMemoPad from "../../components/dashboard/QuickMemoPad";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, syncAllDataFromCloud, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { addDays, toDateKey } from "../../lib/utils/date";
import { getMonthCalendarItems, getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import HomeMonthCalendar from "./components/HomeMonthCalendar";
import TodayTopThree from "./components/TodayTopThree";

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

function MonthlyRecordCard({ data, today, habitStatus }) {
  const monthKey = today.slice(0, 7);
  const monthMoods = (data.moodEntries || []).filter((item) => item.date && item.date.startsWith(monthKey));
  const moodDays = monthMoods.filter((item) => item.mood).length;
  const sleepDays = monthMoods.filter((item) => Number(item.sleepHours) > 0).length;
  return (
    <GlassCard>
      <SectionTitle>이번 달 나의 기록</SectionTitle>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl">😊</p>
          <p className="mt-2 text-2xl font-black text-clover-ink">{moodDays}일</p>
          <p className="mt-1 text-xs font-bold text-clover-sub">기분 기록</p>
        </div>
        <div>
          <p className="text-2xl">🌙</p>
          <p className="mt-2 text-2xl font-black text-clover-ink">{sleepDays}일</p>
          <p className="mt-1 text-xs font-bold text-clover-sub">수면 기록</p>
        </div>
        <div>
          <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ background: `conic-gradient(#2F8A5B ${habitStatus.rate || 0}%, #E9F1EA 0)` }}>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-black text-clover-deep">{habitStatus.rate || 0}%</div>
          </div>
          <p className="mt-1 text-xs font-bold text-clover-sub">루틴 완료</p>
        </div>
      </div>
      <Link to="/journal">
        <AppButton className="mt-4 w-full" variant="soft">✎ 오늘 기록하기</AppButton>
      </Link>
    </GlassCard>
  );
}

function MoneyMosaicCard({ data, today }) {
  const monthKey = today.slice(0, 7);
  const income = (data.payments || []).filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey) && item.status === "입금 완료").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = (data.expenses || []).filter((item) => (item.date || "").startsWith(monthKey)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remain = income - expense;
  const upcoming = (data.payments || []).filter((item) => item.expectedDate >= today && item.status !== "입금 완료").length;
  return (
    <GlassCard>
      <SectionTitle>이번 달 돈관리</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-center">
          <p className="text-xs font-black text-emerald-700">수입</p>
          <p className="mt-1 select-none text-base font-black text-clover-ink blur-[7px]">{money(income)}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 text-center">
          <p className="text-xs font-black text-rose-700">지출</p>
          <p className="mt-1 select-none text-base font-black text-clover-ink blur-[7px]">{money(expense)}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4 text-center">
          <p className="text-xs font-black text-sky-700">남은 돈</p>
          <p className="mt-1 select-none text-base font-black text-clover-ink blur-[7px]">{money(remain)}</p>
        </div>
      </div>
      {!!upcoming && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-center text-xs font-black text-amber-700">확인할 결제 {upcoming}건</p>}
      <Link to="/money">
        <AppButton className="mt-3 w-full" variant="soft">💳 Money로 이동</AppButton>
      </Link>
    </GlassCard>
  );
}

function TodayStudyCard({ data, today, studyDue }) {
  const item = studyDue[0];
  return (
    <GlassCard>
      <SectionTitle>오늘의 공부</SectionTitle>
      {item ? (
        <div className="flex flex-wrap items-center gap-4 rounded-[22px] bg-emerald-50/60 p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-2xl">🎓</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-clover-ink">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-clover-sub">오늘 다시 볼 과제</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">진행 중</span>
          </div>
          <div className="grid shrink-0 gap-2">
            <Link to="/study"><AppButton variant="soft">✎ Study로 이동</AppButton></Link>
            <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-study-complete", { detail: item.id }))}>✓ 완료</AppButton>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 다시 볼 캡처는 없어요.</p>
      )}
    </GlassCard>
  );
}

const kindTone = {
  Work: "bg-sky-50 text-sky-700",
  Plan: "bg-blue-50 text-blue-700",
  Life: "bg-emerald-50 text-emerald-700",
  Memo: "bg-violet-50 text-violet-700",
  Money: "bg-amber-50 text-amber-700",
  Journal: "bg-rose-50 text-rose-700"
};

const kindIcon = {
  Work: "📋",
  Plan: "🗂️",
  Life: "✅",
  Memo: "📱",
  Money: "💳",
  Journal: "📝"
};

const relativeDate = (dateStr, today) => {
  if (!dateStr) return "";
  const date = dateStr.slice(0, 10);
  if (date === today) return "오늘";
  const diff = Math.round((new Date(`${today}T00:00:00`) - new Date(`${date}T00:00:00`)) / 86400000);
  if (diff === 1) return "어제";
  if (diff > 1) return `${diff}일 전`;
  return date;
};

function RecentActivity({ data, today }) {
  const items = [
    ...(data.todos || []).map((item) => ({ ...item, kind: "Work" })),
    ...(data.events || []).map((item) => ({ ...item, kind: "Plan" })),
    ...(data.habitLogs || []).map((item) => ({ ...item, kind: "Life", title: "습관 체크" })),
    ...(data.inboxMemos || []).map((item) => ({ ...item, kind: "Memo", title: item.body })),
    ...(data.payments || []).map((item) => ({ ...item, kind: "Money" })),
    ...(data.reflections || []).map((item) => ({ ...item, kind: "Journal", title: item.body || item.memo }))
  ].filter((item) => dateOf(item)).sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(0, 8);

  return (
    <GlassCard>
      <SectionTitle action={<Link to="/archive" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">전체 보기 ›</Link>}>최근 활동</SectionTitle>
      <div className="grid">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.id || index}`} className={`flex items-center justify-between gap-3 py-3 ${index !== items.length - 1 ? "border-b border-clover-line/60" : ""}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-sm">{kindIcon[item.kind] || "•"}</span>
              <p className="truncate text-sm font-bold text-clover-ink">{titleOf(item)}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${kindTone[item.kind] || "bg-slate-50 text-slate-600"}`}>{item.kind}</span>
            </div>
            <span className="shrink-0 text-xs font-bold text-clover-sub">{relativeDate(dateOf(item), today)}</span>
          </div>
        ))}
        {!items.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 활동 기록이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const now = new Date(`${today}T00:00:00`);
  const navigate = useNavigate();
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
          <Link to={`/schedule?date=${today}`}><AppButton variant="soft">전체 할일</AppButton></Link>
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
        selectedDate={today}
        onSelectDate={(date) => navigate(`/schedule?date=${date}`)}
        onMoveMonth={(amount) => setCalendarMonth((current) => {
          const next = new Date(current.year, current.month + amount, 1);
          return { year: next.getFullYear(), month: next.getMonth() };
        })}
        onToday={() => {
          setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
          navigate(`/schedule?date=${today}`);
        }}
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <MonthlyRecordCard data={data} today={today} habitStatus={habitStatus} />
        <MoneyMosaicCard data={data} today={today} />
      </div>

      <div className="mt-4">
        <TodayStudyCard data={data} today={today} studyDue={studyDue} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle action={<Link to="/worklog" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">전체 보기</Link>}>오늘의 근무일지</SectionTitle>
          <p className="mb-3 text-sm font-bold text-clover-sub">오늘 세션 {(data.workSessions || []).filter((item) => item.date === today).length}건 기록됨</p>
          <Link to="/worklog"><AppButton className="w-full" variant="soft">업무일지 열기 / 작성</AppButton></Link>
        </GlassCard>
        <GlassCard>
          <QuickMemoPad memos={data.inboxMemos || []} />
          <Link to="/memo" className="mt-2 inline-block text-xs font-black text-clover-deep underline decoration-dotted">메모장 전체 보기</Link>
        </GlassCard>
      </div>

      <div className="mt-4">
        <RecentActivity data={data} today={today} />
      </div>
    </>
  );
}

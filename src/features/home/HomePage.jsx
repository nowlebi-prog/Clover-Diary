import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import CustomCheckbox from "../../components/common/CustomCheckbox";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import WeatherCard from "../../components/dashboard/WeatherCard";
import QuickMemoPad from "../../components/dashboard/QuickMemoPad";
import PageHeader from "../../components/layout/PageHeader";
import {
  endActiveSession,
  getActiveSession,
  getAllData,
  getWorkCategories,
  pauseActiveSession,
  resumeActiveSession,
  saveAllData,
  startActiveSession,
  syncAllDataFromCloud,
  updateTodo
} from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { addDays, daysBetween, toDateKey } from "../../lib/utils/date";
import { getTodayItems, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import { computeElapsed, fmtHM, fmtHMS } from "../../lib/utils/workUtils";

const titleOf = (item) => item.title || item.name || item.project || item.body || item.text || item.displayTitle || "기록";
const dateOf = (item) => item.updatedAt || item.createdAt || item.date || item.dueDate || item.expectedDate || "";

const formatTime = (item) => {
  if (item.allDay) return "종일";
  const start = item.startTime || item.time || item.dueTime || "";
  const end = item.endTime || "";
  return end ? `${start} - ${end}` : start || "시간 미정";
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

const ddayLabel = (dday) => {
  if (dday === 0) return "D-0";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
};

function SummaryChips({ todayItems, deadlines, habitStatus, todayFocusSec }) {
  const chips = [
    { label: "오늘 일정", value: `${todayItems.length}개`, tone: "bg-emerald-50 text-emerald-700" },
    { label: "마감", value: `${deadlines.length}건`, tone: "bg-rose-50 text-rose-700" },
    { label: "루틴", value: `${habitStatus.rate || 0}%`, tone: "bg-emerald-50 text-emerald-700" },
    { label: "오늘 집중", value: fmtHM(todayFocusSec), tone: "bg-sky-50 text-sky-700" }
  ];

  return (
    <div className="mb-5 grid gap-2 rounded-[18px] border border-clover-line bg-white/78 p-3 shadow-sm md:grid-cols-4">
      {chips.map((chip, index) => (
        <div key={chip.label} className={`flex items-center gap-3 px-3 py-2 ${index ? "md:border-l md:border-clover-line" : ""}`}>
          <span className={`grid h-10 w-10 place-items-center rounded-full text-xs font-black ${chip.tone}`}>{index + 1}</span>
          <div>
            <p className="text-xs font-black text-clover-sub">{chip.label}</p>
            <p className="mt-0.5 text-xl font-black text-clover-ink">{chip.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeFocusTimer({ activeSession, todayTodos, categories, todayFocusSec, onChange }) {
  const [tick, setTick] = useState(Date.now());
  const [selectedTodoId, setSelectedTodoId] = useState(todayTodos[0]?.id || "");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState(categories[0]?.name || "업무");

  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeSession?.id]);

  useEffect(() => {
    if (!selectedTodoId && todayTodos[0]?.id) setSelectedTodoId(todayTodos[0].id);
  }, [selectedTodoId, todayTodos]);

  const selectedTodo = todayTodos.find((todo) => todo.id === selectedTodoId);
  const elapsed = activeSession ? computeElapsed(activeSession, tick) : null;
  const timerTitle = activeSession?.title || selectedTodo?.title || draftTitle || "시작할 일을 골라주세요";

  const start = () => {
    const title = selectedTodo?.title || draftTitle.trim();
    if (!title) return;
    startActiveSession({ title, category: selectedTodo?.category || selectedTodo?.project || draftCategory || "업무", todoId: selectedTodo?.id || "" });
    setDraftTitle("");
    onChange();
  };

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle>Focus Timer</SectionTitle>
        <Link to="/work" className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-clover-deep">Work로 이동</Link>
      </div>

      {!activeSession && (
        <div className="grid gap-3">
          <AppSelect value={selectedTodoId} onChange={(event) => setSelectedTodoId(event.target.value)}>
            <option value="">직접 입력해서 시작</option>
            {todayTodos.map((todo) => <option key={todo.id} value={todo.id}>{todo.title}</option>)}
          </AppSelect>
          {!selectedTodoId && (
            <>
              <AppInput value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="지금 시작할 일을 적어주세요" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id || category.name}
                    type="button"
                    onClick={() => setDraftCategory(category.name)}
                    className="rounded-full px-3 py-1.5 text-xs font-black transition"
                    style={{
                      background: draftCategory === category.name ? category.color : "#ffffff90",
                      color: draftCategory === category.name ? "#1F2A24" : "#718077"
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="my-5 text-center">
        <p className="mx-auto mb-3 max-w-sm truncate text-base font-black text-clover-text">{timerTitle}</p>
        <p className="font-mono text-6xl font-black tracking-tight text-clover-ink">{activeSession ? fmtHMS(elapsed.workSec) : "25:00"}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {!activeSession && <AppButton className="min-w-40" disabled={!selectedTodo && !draftTitle.trim()} onClick={start}>시작하기</AppButton>}
        {activeSession && (
          elapsed.isPaused
            ? <AppButton onClick={() => { resumeActiveSession(); onChange(); }}>재개</AppButton>
            : <AppButton variant="soft" onClick={() => { pauseActiveSession(); onChange(); }}>일시정지</AppButton>
        )}
        {activeSession && <AppButton variant="danger" onClick={() => { endActiveSession(); onChange(); }}>종료</AppButton>}
      </div>

      <div className="mt-5 rounded-[14px] border border-clover-line bg-white/55 px-4 py-3">
        <p className="text-xs font-black text-clover-sub">오늘 집중 시간</p>
        <p className="mt-1 text-xl font-black text-clover-ink">{fmtHM(todayFocusSec + (elapsed?.workSec || 0))}</p>
      </div>
    </GlassCard>
  );
}

function HomeFocusTimerFixed({ activeSession, todayTodos, categories, todayFocusSec, onChange }) {
  const fallbackCategories = [
    { id: "work", name: "업무", color: "#8DDFA8" },
    { id: "meeting", name: "회의", color: "#A9C9FF" },
    { id: "plan", name: "기획", color: "#F6C68D" },
    { id: "etc", name: "잡무", color: "#F4B6D2" }
  ];
  const categoryList = categories?.length ? categories : fallbackCategories;
  const [tick, setTick] = useState(Date.now());
  const [selectedTodoId, setSelectedTodoId] = useState(todayTodos[0]?.id || "");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState(categoryList[0]?.name || "업무");

  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeSession?.id]);

  useEffect(() => {
    if (!selectedTodoId && todayTodos[0]?.id) setSelectedTodoId(todayTodos[0].id);
  }, [selectedTodoId, todayTodos]);

  useEffect(() => {
    if (!categoryList.some((category) => category.name === draftCategory)) {
      setDraftCategory(categoryList[0]?.name || "업무");
    }
  }, [categoryList, draftCategory]);

  const selectedTodo = todayTodos.find((todo) => todo.id === selectedTodoId);
  const elapsed = activeSession ? computeElapsed(activeSession, tick) : null;
  const timerTitle = activeSession?.title || selectedTodo?.title || draftTitle || "바로 시작할 일을 적어주세요";

  const start = () => {
    const title = selectedTodo?.title || draftTitle.trim();
    if (!title) return;
    startActiveSession({
      title,
      category: selectedTodo?.category || selectedTodo?.project || draftCategory || "업무",
      todoId: selectedTodo?.id || ""
    });
    setDraftTitle("");
    setTick(Date.now());
    onChange?.();
  };

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle>Focus Timer</SectionTitle>
        <Link to="/work" className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-clover-deep">Work로 이동</Link>
      </div>

      {!activeSession && (
        <div className="grid gap-3">
          <AppSelect value={selectedTodoId} onChange={(event) => setSelectedTodoId(event.target.value)}>
            <option value="">직접 입력해서 시작</option>
            {todayTodos.map((todo) => <option key={todo.id} value={todo.id}>{todo.title}</option>)}
          </AppSelect>
          {!selectedTodoId && (
            <>
              <AppInput value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="지금 시작할 일을 적어주세요" />
              <div className="flex flex-wrap gap-2">
                {categoryList.map((category) => (
                  <button
                    key={category.id || category.name}
                    type="button"
                    onClick={() => setDraftCategory(category.name)}
                    className="rounded-full px-3 py-1.5 text-xs font-black transition"
                    style={{
                      background: draftCategory === category.name ? category.color : "#ffffff90",
                      color: draftCategory === category.name ? "#1F2A24" : "#718077"
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="my-5 text-center">
        <p className="mx-auto mb-3 max-w-sm truncate text-base font-black text-clover-text">{timerTitle}</p>
        <p className="font-mono text-5xl font-black tracking-tight text-clover-ink md:text-6xl">
          {activeSession ? fmtHMS(elapsed.workSec) : "00:00:00"}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {!activeSession && <AppButton className="min-w-40" disabled={!selectedTodo && !draftTitle.trim()} onClick={start}>시작하기</AppButton>}
        {activeSession && (
          elapsed.isPaused
            ? <AppButton onClick={() => { resumeActiveSession(); setTick(Date.now()); onChange?.(); }}>재개</AppButton>
            : <AppButton variant="soft" onClick={() => { pauseActiveSession(); setTick(Date.now()); onChange?.(); }}>일시정지</AppButton>
        )}
        {activeSession && <AppButton variant="danger" onClick={() => { endActiveSession(); setTick(Date.now()); onChange?.(); }}>종료</AppButton>}
      </div>

      <div className="mt-5 rounded-[14px] border border-clover-line bg-white/55 px-4 py-3">
        <p className="text-xs font-black text-clover-sub">오늘 집중 시간</p>
        <p className="mt-1 text-xl font-black text-clover-ink">{fmtHM(todayFocusSec + (elapsed?.workSec || 0))}</p>
      </div>
    </GlassCard>
  );
}

function PriorityCard({ topItems, deadlineItems, onToggleTodo, onStart, onSchedule }) {
  const seen = new Set();
  const cleanTop = topItems.filter((item) => {
    const key = item.todoId || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const cleanDeadlines = deadlineItems.filter((item) => !seen.has(item.id) && !seen.has(item.displayTitle)).slice(0, 3);

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <SectionTitle>오늘 우선순위</SectionTitle>
      <div className="grid gap-4">
        <div className="rounded-[16px] border border-clover-line bg-white/55 p-3">
          <p className="mb-3 text-xs font-black text-clover-deep">오늘 꼭!</p>
          <div className="grid gap-2">
            {cleanTop.map((item) => (
              <article key={`${item.source}-${item.id || item.title}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[12px] border border-clover-line bg-white/75 px-3 py-2">
                <CustomCheckbox checked={Boolean(item.completed)} onChange={(checked) => item.source === "todo" ? onToggleTodo(item.id, checked) : onSchedule(item)} label={item.title || item.displayTitle} />
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => onStart(item)} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-clover-deep">시작</button>
                  <button type="button" onClick={() => onSchedule(item)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-clover-sub">일정</button>
                </div>
              </article>
            ))}
            {!cleanTop.length && <p className="rounded-[12px] bg-white/55 p-3 text-sm font-bold text-clover-sub">일정이나 할 일에서 오늘 꼭!을 체크해보세요.</p>}
          </div>
        </div>

        <div className="rounded-[16px] border border-rose-100 bg-rose-50/35 p-3">
          <p className="mb-3 text-xs font-black text-rose-600">마감 주의</p>
          <div className="grid gap-2">
            {cleanDeadlines.map((item, index) => (
              <Link key={`${item.type}-${item.id || index}`} to={item.type === "payment" ? "/money" : `/schedule?date=${item.date}`} className="flex items-center justify-between gap-3 rounded-[12px] bg-white/70 px-3 py-3 text-sm font-bold">
                <span className="min-w-0 truncate">{item.displayTitle}</span>
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-600">{ddayLabel(item.dday)}</span>
              </Link>
            ))}
            {!cleanDeadlines.length && <p className="rounded-[12px] bg-white/55 p-3 text-sm font-bold text-clover-sub">급한 마감은 없어요.</p>}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function TodayScheduleCard({ items, today }) {
  const navigate = useNavigate();
  const visible = items.filter((item) => !item.allDay).slice(0, 6);
  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <SectionTitle action={<button type="button" onClick={() => navigate(`/schedule?date=${today}`)} className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-clover-deep">수정</button>}>오늘 일정</SectionTitle>
      <div className="grid gap-2">
        {visible.map((item, index) => (
          <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[72px_auto_1fr] items-center gap-3 border-b border-clover-line/60 py-2 text-sm last:border-0">
            <span className="text-xs font-black text-clover-sub">{formatTime(item)}</span>
            <span className="h-2.5 w-2.5 rounded-full bg-clover-deep" />
            <b className="min-w-0 truncate">{item.displayTitle}</b>
          </article>
        ))}
        {!visible.length && <p className="rounded-[12px] bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 시간 일정은 없어요.</p>}
      </div>
      <button type="button" onClick={() => navigate(`/schedule?date=${today}`)} className="mt-3 w-full rounded-full bg-white/75 px-4 py-2 text-sm font-black text-clover-deep">전체 일정 보기</button>
    </GlassCard>
  );
}

function WeeklyStrip({ data, today }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, weekOffset * 7 + index));
  const selectedItems = getTodayItems(data, selectedDate).slice(0, 8);
  const monthLabel = new Date(`${days[0]}T00:00:00`).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <SectionTitle action={<Link to={`/schedule?date=${selectedDate}`} className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-clover-deep">Schedule로 이동</Link>}>이번주 한눈에 보기</SectionTitle>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => setWeekOffset((value) => {
          const next = value - 1;
          setSelectedDate(addDays(today, next * 7));
          return next;
        })} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-sub">이전</button>
        <span className="text-xs font-black text-clover-sub">{monthLabel}</span>
        <button type="button" onClick={() => setWeekOffset((value) => {
          const next = value + 1;
          setSelectedDate(addDays(today, next * 7));
          return next;
        })} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black text-clover-sub">다음</button>
      </div>
      <div className="grid grid-cols-7 gap-2 rounded-[16px] border border-clover-line bg-white/55 p-3 text-center">
        {days.map((date) => {
          const count = getTodayItems(data, date).length;
          const day = new Date(`${date}T00:00:00`).toLocaleDateString("ko-KR", { weekday: "short" });
          return (
            <button key={date} type="button" onClick={() => setSelectedDate(date)} className={`rounded-[12px] px-1 py-3 ${date === selectedDate ? "bg-emerald-50 text-clover-deep" : "hover:bg-white/70"}`}>
              <p className="text-xs font-black text-clover-sub">{day}</p>
              <p className="mt-1 text-lg font-black">{Number(date.slice(-2))}</p>
              <p className="mt-2 text-xs font-bold text-clover-sub">{count}개</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[16px] bg-white/45 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-black text-clover-deep">{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일 일정</p>
          <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-black text-clover-sub">{selectedItems.length}개</span>
        </div>
        <div className="grid gap-1.5">
          {selectedItems.map((item, index) => (
            <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-2 rounded-[10px] bg-white/65 px-2.5 py-2 text-xs">
              <span className="font-black text-clover-sub">{formatTime(item)}</span>
              <b className="min-w-0 truncate text-clover-ink">{item.displayTitle}</b>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-clover-deep">{item.label || item.type}</span>
            </article>
          ))}
          {!selectedItems.length && <p className="rounded-[10px] bg-white/55 p-3 text-xs font-bold text-clover-sub">선택한 날짜에는 일정이 없어요.</p>}
        </div>
      </div>
    </GlassCard>
  );
}

function StatusCards({ data, today, habitStatus, studyDue, workSessions }) {
  const todayMood = (data.moodEntries || []).some((item) => item.date === today);
  const todayPayments = (data.payments || []).filter((item) => item.expectedDate === today && item.status !== "입금 완료");
  const cards = [
    { title: "Life", to: "/life", main: `루틴 ${habitStatus.doneCount}/${habitStatus.total} 완료`, note: todayMood ? "기분 기록 완료" : "기분 기록이 필요해요" },
    { title: "Money", to: "/money", main: `확인할 결제 ${todayPayments.length}건`, note: "금액은 Money에서 확인" },
    { title: "Study", to: "/study", main: `오늘 공부 ${studyDue.length ? "1개" : "0개"}`, note: studyDue[0]?.title || "오늘 복습 없음" },
    { title: "Work Log", to: "/worklog", main: `오늘 업무 세션 ${workSessions.length}개`, note: "업무일지로 이동" }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <GlassCard key={card.title} className="rounded-[16px] border border-clover-line bg-white/84 p-4">
          <p className="text-lg font-black text-clover-deep">{card.title}</p>
          <p className="mt-4 text-sm font-black text-clover-ink">{card.main}</p>
          <p className="mt-2 line-clamp-1 text-xs font-bold text-clover-sub">{card.note}</p>
          <Link to={card.to} className="mt-5 inline-block text-sm font-black text-clover-deep">{card.title.replace(" Log", "")}로 이동</Link>
        </GlassCard>
      ))}
    </div>
  );
}

const kindTone = {
  Work: "bg-sky-50 text-sky-700",
  Schedule: "bg-emerald-50 text-emerald-700",
  Life: "bg-emerald-50 text-emerald-700",
  Memo: "bg-violet-50 text-violet-700",
  Money: "bg-amber-50 text-amber-700",
  Journal: "bg-rose-50 text-rose-700",
  Study: "bg-indigo-50 text-indigo-700"
};

function RecentActivity({ data, today }) {
  const items = [
    ...(data.todos || []).map((item) => ({ ...item, kind: "Work" })),
    ...(data.events || []).map((item) => ({ ...item, kind: "Schedule" })),
    ...(data.habitLogs || []).map((item) => ({ ...item, kind: "Life", title: "습관 체크" })),
    ...(data.memoPosts || data.inboxMemos || []).map((item) => ({ ...item, kind: "Memo", title: item.title || item.body })),
    ...(data.payments || []).map((item) => ({ ...item, kind: "Money" })),
    ...(data.reflections || []).map((item) => ({ ...item, kind: "Journal", title: item.body || item.memo })),
    ...(data.studyCaptures || []).map((item) => ({ ...item, kind: "Study" }))
  ].filter((item) => dateOf(item)).sort((a, b) => dateOf(b).localeCompare(dateOf(a))).slice(0, 5);

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <SectionTitle action={<Link to="/archive" className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep">전체 보기</Link>}>최근 활동</SectionTitle>
      <div className="grid">
        {items.map((item, index) => (
          <div key={`${item.kind}-${item.id || index}`} className={`flex items-center justify-between gap-3 py-3 ${index !== items.length - 1 ? "border-b border-clover-line/60" : ""}`}>
            <div className="flex min-w-0 items-center gap-3">
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
  const [activeSession, setActiveSessionState] = useState(getActiveSession());
  const today = toDateKey(new Date());
  const navigate = useNavigate();

  const load = () => {
    setData(getAllData());
    setActiveSessionState(getActiveSession());
  };

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const refreshNow = async () => {
    await syncAllDataFromCloud();
    load();
  };

  const todayItems = useMemo(() => getTodayItems(data, today), [data, today]);
  const deadlines = useMemo(() => getUpcomingDeadlines(data, today).filter((item) => item.dday >= 0 && item.dday <= 1), [data, today]);
  const habitStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const workSessions = (data.workSessions || []).filter((item) => item.date === today);
  const todayFocusSec = workSessions.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const studyDue = (data.studyCaptures || []).filter((item) => !item.isReviewed || item.reviewSchedule?.nextReviewAt <= today || item.status === "waiting");
  const todayTodos = (data.todos || []).filter((todo) => !todo.completed && (!todo.dueDate || todo.dueDate <= today));
  const categories = getWorkCategories();
  const todayMustItems = [
    ...todayTodos.filter((todo) => todo.todayMust).map((todo) => ({ ...todo, source: "todo" })),
    ...(data.events || []).filter((event) => !event.completed && event.todayMust && event.date === today).map((event) => ({ ...event, source: "event", displayTitle: event.title }))
  ];
  const dailyQuote = useMemo(() => {
    const savedQuotes = (data.quotes || [])
      .map((quote) => ({
        text: (quote.text || quote.body || quote.title || "").trim(),
        source: (quote.source || "").trim()
      }))
      .filter((quote) => quote.text);
    if (!savedQuotes.length) return "";
    const seed = today.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const quote = savedQuotes[seed % savedQuotes.length];
    return quote.source ? `${quote.text} · ${quote.source}` : quote.text;
  }, [data.quotes, today]);

  const toggleTodo = (id, completed) => {
    updateTodo(id, { completed, completedAt: completed ? today : "" });
    load();
  };

  const startTodo = (todo) => {
    startActiveSession({ title: todo.title || todo.displayTitle, category: todo.category || todo.project || "업무", todoId: todo.source === "todo" ? todo.id : "" });
    load();
  };

  const scheduleTodo = (item) => {
    navigate(`/schedule?date=${item.dueDate || item.date || today}`);
  };

  return (
    <>
      <PageHeader eyebrow={today} title="오늘도 Lucky Day 🍀">
        <div className="flex flex-wrap items-center gap-2">
          <WeatherCard />
          <AppButton variant="soft" onClick={refreshNow}>새로고침</AppButton>
          <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
        </div>
      </PageHeader>
      {dailyQuote && (
        <p className="-mt-3 mb-5 max-w-3xl break-keep text-sm font-bold leading-6 text-clover-sub">
          {dailyQuote}
        </p>
      )}

      <SummaryChips todayItems={todayItems} deadlines={deadlines} habitStatus={habitStatus} todayFocusSec={todayFocusSec} />

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,.82fr)_minmax(0,1.18fr)]">
        <HomeFocusTimerFixed activeSession={activeSession} todayTodos={todayTodos} categories={categories} todayFocusSec={todayFocusSec} onChange={load} />
        <PriorityCard
          topItems={todayMustItems}
          deadlineItems={deadlines}
          onToggleTodo={toggleTodo}
          onStart={startTodo}
          onSchedule={scheduleTodo}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TodayScheduleCard items={todayItems} today={today} />
        <WeeklyStrip data={data} today={today} />
      </div>

      <div className="mt-4">
        <StatusCards data={data} today={today} habitStatus={habitStatus} studyDue={studyDue} workSessions={workSessions} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(320px,.85fr)_minmax(0,1.15fr)]">
        <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
          <QuickMemoPad memos={data.memoPosts || data.inboxMemos || []} />
          <Link to="/memo" className="mt-2 inline-block text-xs font-black text-clover-deep underline decoration-dotted">메모장 전체 보기</Link>
        </GlassCard>
        <RecentActivity data={data} today={today} />
      </div>
    </>
  );
}

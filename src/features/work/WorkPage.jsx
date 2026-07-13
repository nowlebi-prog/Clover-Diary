import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import TimeTracker from "../../components/work/TimeTracker";
import WorkLog from "../../components/work/WorkLog";
import WorkStats from "../../components/work/WorkStats";
import HomeMonthCalendar from "../home/components/HomeMonthCalendar";
import {
  getActiveSession,
  getAllData,
  getWorkCategories,
  saveAllData
} from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems, getTodayItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const memoId = () => `work-memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTime = (item) => {
  if (item.allDay) return "종일";
  const start = item.startTime || item.time || item.dueTime || "";
  const end = item.endTime || "";
  return end ? `${start} - ${end}` : start || "시간 미정";
};

const formatFocus = (seconds) => {
  const total = Number(seconds || 0);
  if (!total) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (hours && minutes) return `${hours}시간 ${minutes}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
};

function WorkMemoPad({ today, onChange }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState(getAllData());

  const notes = useMemo(() => data.workMemos?.[today] || [], [data, today]);
  const openNotes = notes.filter((note) => !note.confirmed);
  const confirmedNotes = notes.filter((note) => note.confirmed);

  const refresh = () => {
    const next = getAllData();
    setData(next);
    onChange?.();
  };

  const commit = (recipe) => {
    const next = getAllData();
    next.workMemos = next.workMemos || {};
    next.workMemos[today] = next.workMemos[today] || [];
    recipe(next.workMemos[today]);
    saveAllData(next);
    refresh();
  };

  const saveMemo = () => {
    const text = draft.trim();
    if (!text) return;
    commit((list) => {
      if (editingId) {
        const target = list.find((note) => note.id === editingId);
        if (target) {
          target.text = text;
          target.updatedAt = new Date().toISOString();
        }
      } else {
        list.unshift({
          id: memoId(),
          text,
          confirmed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    setDraft("");
    setEditingId(null);
  };

  const editMemo = (note) => {
    setEditingId(note.id);
    setDraft(note.text);
  };

  const toggleConfirm = (noteId) => {
    commit((list) => {
      const target = list.find((note) => note.id === noteId);
      if (target) {
        target.confirmed = !target.confirmed;
        target.updatedAt = new Date().toISOString();
      }
    });
  };

  const deleteMemo = (noteId) => {
    commit((list) => {
      const index = list.findIndex((note) => note.id === noteId);
      if (index >= 0) list.splice(index, 1);
    });
  };

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">메모장</h2>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              setEditingId(null);
            }}
            className="text-xs font-black text-clover-sub"
          >
            취소
          </button>
        )}
      </div>

      <div className="grid gap-3">
        <AppTextarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메모할 내용을 입력하세요. 여러 개를 하나씩 쌓아둘 수 있어요."
          className="min-h-[104px]"
        />
        <AppButton onClick={saveMemo} className="w-full">
          {editingId ? "메모 수정하기" : "메모 추가하기"}
        </AppButton>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-black">메모 목록 ({openNotes.length})</h3>
        <div className="grid gap-2">
          {openNotes.map((note) => (
            <div key={note.id} className="rounded-[14px] border border-clover-line bg-white/65 p-4">
              <p className="whitespace-pre-wrap text-sm font-bold leading-6">{note.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleConfirm(note.id)} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  확인
                </button>
                <button onClick={() => editMemo(note)} className="rounded-full bg-white px-3 py-1 text-xs font-black text-clover-deep">
                  수정
                </button>
                <button onClick={() => deleteMemo(note.id)} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">
                  삭제
                </button>
              </div>
            </div>
          ))}
          {!openNotes.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">등록된 메모가 없어요.</p>}
        </div>
      </div>

      <details className="mt-4 rounded-[14px] border border-clover-line bg-white/45 p-4">
        <summary className="cursor-pointer text-sm font-black text-clover-sub">확인된 메모 ({confirmedNotes.length})</summary>
        <div className="mt-3 grid gap-2">
          {confirmedNotes.map((note) => (
            <div key={note.id} className="rounded-2xl bg-white/55 p-3 text-sm font-bold text-clover-sub">
              <p className="whitespace-pre-wrap">{note.text}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => toggleConfirm(note.id)} className="text-xs font-black text-clover-deep">되돌리기</button>
                <button onClick={() => deleteMemo(note.id)} className="text-xs font-black text-rose-500">삭제</button>
              </div>
            </div>
          ))}
          {!confirmedNotes.length && <p className="text-sm font-bold text-clover-sub">아직 확인된 메모가 없어요.</p>}
        </div>
      </details>
    </GlassCard>
  );
}

function WorkTabs() {
  const tabs = [
    { label: "근무일지", href: "#worklog" },
    { label: "메모장", href: "#memo" }
  ];
  return (
    <nav className="mb-4 flex gap-2 overflow-x-auto rounded-[18px] border border-clover-line bg-white/55 p-2 shadow-sm">
      {tabs.map((tab) => (
        <a key={tab.href} href={tab.href} className="shrink-0 rounded-full px-5 py-2.5 text-sm font-black text-clover-sub transition hover:bg-white hover:text-clover-deep">
          {tab.label}
        </a>
      ))}
    </nav>
  );
}

function WorkTodayBrief({ items, onOpenSchedule }) {
  const todos = items.filter((item) => item.type === "todo").slice(0, 5);
  const timed = items.filter((item) => !item.allDay).slice(0, 5);

  return (
    <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
      <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionTitle>오늘의 할 일</SectionTitle>
          <button type="button" onClick={onOpenSchedule} className="rounded-[10px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-deep">
            수정
          </button>
        </div>
        <div className="grid gap-2">
          {todos.map((item) => (
            <article key={item.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-[12px] border border-clover-line bg-white/72 px-3 py-2.5 text-sm">
              <span className="h-3 w-3 rounded-full border border-clover-line" />
              <b className="min-w-0 truncate">{item.displayTitle}</b>
              {!!item.focusSeconds && <span className="text-xs font-black text-clover-deep">{formatFocus(item.focusSeconds)}</span>}
              <StatusBadge tone="blue">{item.category || "업무"}</StatusBadge>
            </article>
          ))}
          {!todos.length && <p className="rounded-[12px] bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 할 일이 비어 있어요.</p>}
        </div>
      </GlassCard>

      <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionTitle>오늘 타임라인</SectionTitle>
          <button type="button" onClick={onOpenSchedule} className="rounded-[10px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-deep">
            수정
          </button>
        </div>
        <div className="grid gap-2">
          {timed.map((item) => (
            <article key={`${item.type}-${item.id}`} className="grid grid-cols-[70px_1fr_auto] items-center gap-3 rounded-[12px] bg-white/70 px-3 py-2.5 text-sm">
              <b className="text-xs text-clover-deep">{formatTime(item)}</b>
              <span className="min-w-0 truncate font-bold">{item.displayTitle}</span>
              <StatusBadge tone={item.type === "payment" ? "danger" : item.type === "todo" ? "blue" : "mint"}>{item.label || item.type}</StatusBadge>
            </article>
          ))}
          {!timed.length && <p className="rounded-[12px] bg-white/45 p-4 text-sm font-bold text-clover-sub">시간이 정해진 일정은 아직 없어요.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

function WorkCalendarCard({ year, month, itemsByDate, selectedDate, onSelectDate, onMoveMonth, onToday }) {
  return (
    <HomeMonthCalendar
      year={year}
      month={month}
      itemsByDate={itemsByDate}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onMoveMonth={onMoveMonth}
      onToday={onToday}
      title="업무 캘린더"
      subtitle="일정을 한눈에 확인하고 스케줄로 이동"
    />
  );
}

function WorkReflectionCard({ today, onChange }) {
  const [draft, setDraft] = useState(() => getAllData().workLogNotes?.[today]?.reflection || "");

  useEffect(() => {
    setDraft(getAllData().workLogNotes?.[today]?.reflection || "");
  }, [today]);

  const save = () => {
    const next = getAllData();
    next.workLogNotes = {
      ...(next.workLogNotes || {}),
      [today]: {
        ...(next.workLogNotes?.[today] || {}),
        reflection: draft,
        updatedAt: new Date().toISOString()
      }
    };
    saveAllData(next);
    onChange?.();
  };

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <SectionTitle>업무 회고</SectionTitle>
        <AppButton variant="soft" onClick={save}>저장</AppButton>
      </div>
      <AppTextarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="오늘 잘 된 점, 막힌 점, 다음에 덜 힘들게 할 방법을 적어두세요."
        className="min-h-[112px]"
      />
    </GlassCard>
  );
}

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const navigate = useNavigate();
  const initial = new Date(`${today}T00:00:00`);
  const [calendarMonth, setCalendarMonth] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const categories = getWorkCategories();
  const activeSession = getActiveSession();
  const sessions = data.workSessions || [];
  const weeklyGoalHours = Number(data.workSettings?.weeklyGoalHours || 40);
  const todayItems = useMemo(() => getTodayItems(data, today), [data, today]);
  const todayTodos = useMemo(
    () => (data.todos || []).filter((todo) => !todo.completed && (!todo.dueDate || todo.dueDate <= today)).slice(0, 12),
    [data.todos, today]
  );
  const monthItems = useMemo(() => getMonthCalendarItems(data, calendarMonth.year, calendarMonth.month), [data, calendarMonth]);

  const saveWeeklyGoal = (value) => {
    const next = getAllData();
    next.workSettings = { ...(next.workSettings || {}), weeklyGoalHours: value };
    saveAllData(next);
    load();
  };

  const toggleTodoNeedMove = (item) => {
    if (item.type !== "todo") return;
    const next = getAllData();
    next.todos = (next.todos || []).map((todo) => todo.id === item.id ? { ...todo, needMove: !todo.needMove } : todo);
    saveAllData(next);
    load();
  };

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실">
        <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>
          + 할 일 추가
        </AppButton>
      </PageHeader>

      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">오늘의 계획을 실행하고 기록하세요.</p>
      <WorkTabs />
      <WorkTodayBrief items={todayItems} onOpenSchedule={() => navigate(`/schedule?date=${today}`)} />

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(360px,0.85fr)]">
        <TimeTracker activeSession={activeSession} categories={categories} todos={todayTodos} onChange={load} />
        <WorkStats sessions={sessions} categories={categories} today={today} weeklyGoalHours={weeklyGoalHours} onWeeklyGoalHoursChange={saveWeeklyGoal} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(320px,0.85fr)]">
        <WorkCalendarCard
          year={calendarMonth.year}
          month={calendarMonth.month}
          itemsByDate={monthItems}
          selectedDate={today}
          onSelectDate={(date) => navigate(`/schedule?date=${date}`)}
          onMoveMonth={(amount) => setCalendarMonth((current) => {
            const next = new Date(current.year, current.month + amount, 1);
            return { year: next.getFullYear(), month: next.getMonth() };
          })}
          onToday={() => setCalendarMonth({ year: initial.getFullYear(), month: initial.getMonth() })}
        />
        <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionTitle>오늘 전체 타임라인</SectionTitle>
            <button type="button" onClick={() => navigate(`/schedule?date=${today}`)} className="rounded-[10px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-deep">전체 보기</button>
          </div>
          <TodayTimeline items={todayItems} onToggleNeedMove={toggleTodoNeedMove} />
        </GlassCard>
        <div id="memo">
          <WorkMemoPad today={today} onChange={load} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div id="worklog">
          <WorkLog sessions={sessions} categories={categories} today={today} onChange={load} />
        </div>
        <WorkReflectionCard today={today} onChange={load} />
      </div>
    </>
  );
}

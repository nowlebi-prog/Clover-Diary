import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import PageHeader from "../../components/layout/PageHeader";
import HomeMonthCalendar from "../home/components/HomeMonthCalendar";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const categoryOptions = ["일정", "업무", "개인", "학습", "돈관리", "집안일", "기타"];
const hours = Array.from({ length: 16 }, (_, index) => index + 8);

const categoryTone = {
  일정: "mint",
  업무: "blue",
  개인: "lavender",
  학습: "warning",
  돈관리: "danger",
  집안일: "cream",
  기타: "cream"
};

const categoryLine = {
  일정: "border-emerald-200 bg-emerald-50/75 text-emerald-900",
  업무: "border-sky-200 bg-sky-50/75 text-sky-900",
  개인: "border-violet-200 bg-violet-50/75 text-violet-900",
  학습: "border-orange-200 bg-orange-50/75 text-orange-900",
  돈관리: "border-rose-200 bg-rose-50/75 text-rose-900",
  집안일: "border-amber-200 bg-amber-50/75 text-amber-900",
  기타: "border-slate-200 bg-slate-50/80 text-slate-900"
};

const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

const formatTime = (value) => {
  if (!value) return "";
  const [hour = "", minute = "00"] = String(value).split(":");
  if (!hour) return "";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const timeText = (item) => {
  if (item.allDay) return "종일";
  const start = formatTime(item.startTime || item.time || item.dueTime);
  const end = formatTime(item.endTime);
  if (start && end) return `${start} - ${end}`;
  return start || "시간 미정";
};

const titleOf = (item) => item.title || item.project || item.name || "새 일정";
const scheduleDateOf = (item) => item.date || item.dueDate || item.expectedDate || item.publishDate || "";

const fromCollection = (items, collection, selectedDate, dateKey, category, timeKey = "time") =>
  (items || [])
    .filter((item) => !item.completed && item[dateKey] === selectedDate)
    .map((item) => ({
      ...item,
      collection,
      sourceType: collection,
      title: titleOf(item),
      date: item[dateKey],
      startTime: item.startTime || item[timeKey] || item.dueTime || "",
      endTime: item.endTime || "",
      category: item.category || category
    }));

const normalizeScheduleItems = (data, selectedDate) => {
  const todos = (data.todos || [])
    .filter((item) => !item.completed && (item.dueDate === selectedDate || (item.endDate && item.dueDate <= selectedDate && selectedDate <= item.endDate)))
    .map((item) => ({
      ...item,
      collection: "todos",
      sourceType: "todo",
      title: titleOf(item),
      date: item.dueDate,
      startTime: item.allDay ? "" : (item.dueDate === selectedDate ? item.startTime || item.dueTime || "" : "00:00"),
      endTime: item.allDay ? "" : (item.endDate && item.endDate !== selectedDate ? "23:59" : item.endTime || ""),
      category: item.category || item.project || "업무"
    }));

  const events = (data.events || [])
    .filter((item) => item.date === selectedDate && !item.completed)
    .map((item) => ({
      ...item,
      collection: "events",
      sourceType: "event",
      title: titleOf(item),
      startTime: item.startTime || item.time || "",
      category: item.category || "일정"
    }));

  const payments = fromCollection(data.payments, "payments", selectedDate, "expectedDate", "돈관리");
  const expenses = fromCollection(data.expenses, "expenses", selectedDate, "date", "돈관리");
  const contentPlans = fromCollection(data.contentPlans, "contentPlans", selectedDate, "publishDate", "업무");
  const campaigns = [
    ...fromCollection(data.campaigns, "campaigns", selectedDate, "applyDueDate", "업무"),
    ...fromCollection(data.campaigns, "campaigns", selectedDate, "uploadDueDate", "업무")
  ];

  return [...events, ...todos, ...payments, ...expenses, ...contentPlans, ...campaigns].sort((a, b) => {
    const aTime = a.allDay ? "00:00" : (a.startTime || a.time || "99:99");
    const bTime = b.allDay ? "00:00" : (b.startTime || b.time || "99:99");
    return aTime.localeCompare(bTime) || titleOf(a).localeCompare(titleOf(b));
  });
};

const emptySchedule = (date) => ({
  collection: "events",
  title: "",
  date,
  startTime: "09:00",
  time: "09:00",
  endTime: "10:00",
  category: "일정",
  memo: "",
  completed: false
});

const parseQuickLines = (text) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d{1,2}):(\d{2})\s*[~-]\s*(\d{1,2}):(\d{2})\s+(.+)$/);
      if (!match) return null;
      const [, sh, sm, eh, em, title] = match;
      return {
        startTime: `${sh.padStart(2, "0")}:${sm}`,
        endTime: `${eh.padStart(2, "0")}:${em}`,
        title: title.trim()
      };
    })
    .filter(Boolean);
};

function ScheduleList({ selectedDate, items, onAdd, onEdit, onDelete, onComplete }) {
  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle>{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일 일정</SectionTitle>
        <button type="button" onClick={onAdd} className="rounded-[10px] bg-emerald-50 px-3 py-2 text-xs font-black text-clover-deep">
          + 일정 추가
        </button>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <article key={`${item.collection}-${item.id}`} className="grid grid-cols-[auto_auto_92px_1fr_auto] items-center gap-3 rounded-[14px] border border-clover-line bg-white/72 px-3 py-3 text-sm max-sm:grid-cols-[auto_1fr_auto]">
            <input
              type="checkbox"
              checked={false}
              aria-label={`${item.title} 완료`}
              onChange={() => onComplete(item)}
              className="h-4 w-4 rounded border-clover-line"
            />
            <StatusBadge tone={categoryTone[item.category] || "mint"}>{item.category || "일정"}</StatusBadge>
            <span className="text-xs font-black text-clover-sub max-sm:hidden">{timeText(item)}</span>
            <b className="min-w-0 truncate">{item.title}</b>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => onEdit(item)} className="rounded-[8px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-sub">수정</button>
              <button type="button" onClick={() => onDelete(item)} className="rounded-[8px] border border-clover-line bg-white px-3 py-1.5 text-xs font-black text-clover-sub">삭제</button>
            </div>
          </article>
        ))}
        {!items.length && <p className="rounded-[14px] bg-white/45 p-4 text-sm font-bold text-clover-sub">선택한 날짜에는 아직 일정이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function QuickTimelineInput({ value, onChange, onApply }) {
  return (
    <div className="rounded-[18px] border border-clover-line bg-white/70 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black">빠른 입력 <span className="text-xs font-bold text-clover-sub">(한 줄에 하나씩 입력하세요)</span></p>
        <button type="button" onClick={onApply} className="rounded-[10px] bg-emerald-50 px-4 py-2 text-xs font-black text-clover-deep">자동 반영</button>
      </div>
      <AppTextarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"09:00~12:00 밥\n12:00~13:00 술"}
        className="min-h-[104px] rounded-[12px] bg-white/80"
      />
      <p className="mt-2 text-xs font-bold text-clover-sub">예시: 09:00~10:00 회의</p>
    </div>
  );
}

function TimelineEditor({ selectedDate, items, quickText, onQuickText, onApplyQuick, onEdit, onDelete, showDetails, onToggleDetails }) {
  const timedItems = items.filter((item) => !item.allDay);

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/86 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SectionTitle>타임라인</SectionTitle>
          <span className="text-sm font-black text-clover-sub">
            {Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일
          </span>
        </div>
        <button type="button" onClick={onToggleDetails} className="rounded-[10px] border border-clover-line bg-white px-3 py-2 text-xs font-black text-clover-sub">
          세부옵션
        </button>
      </div>

      <QuickTimelineInput value={quickText} onChange={onQuickText} onApply={onApplyQuick} />

      {showDetails && (
        <p className="mt-3 rounded-[12px] bg-slate-50 px-4 py-3 text-xs font-bold text-clover-sub">
          세부옵션이 켜져 있어요. 아래 타임라인의 연필 버튼을 누르면 시간, 제목, 분류, 메모를 수정할 수 있어요.
        </p>
      )}

      <div className="mt-5 grid gap-0">
        {hours.map((hour) => {
          const hourItems = timedItems.filter((item) => Number((item.startTime || item.time || "99").slice(0, 2)) === hour);
          return (
            <div key={hour} className="grid min-h-[54px] grid-cols-[58px_1fr] gap-4 border-b border-dashed border-slate-200">
              <div className="pt-3 text-right text-xs font-black text-clover-sub">{String(hour).padStart(2, "0")}:00</div>
              <div className="grid content-start gap-2 py-2">
                {hourItems.map((item) => (
                  <article key={`${item.collection}-${item.id}`} className={`grid grid-cols-[128px_1fr_auto] items-center gap-3 rounded-[10px] border px-4 py-2.5 text-sm shadow-sm ${categoryLine[item.category] || categoryLine["기타"]}`}>
                    <span className="text-xs font-black">{timeText(item)}</span>
                    <b className="min-w-0 truncate">{item.title}</b>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onEdit(item)} className="rounded-[8px] bg-white/85 px-3 py-1.5 text-xs font-black">수정</button>
                      <button type="button" onClick={() => onDelete(item)} className="rounded-[8px] bg-white/85 px-3 py-1.5 text-xs font-black">삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
        {!timedItems.length && <p className="rounded-[14px] bg-white/45 p-4 text-sm font-bold text-clover-sub">시간이 정해진 일정은 아직 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function ScheduleEditor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(item || {});
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title={item ? "일정 상세 수정" : ""} onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">
          일정 제목
          <AppInput value={form.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="예: 주간 보고서 작성" autoFocus />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">
            분류
            <AppSelect value={form.category || "일정"} onChange={(event) => set("category", event.target.value)}>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </AppSelect>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            시작
            <AppInput value={form.startTime || form.time || ""} onChange={(event) => { set("startTime", event.target.value); set("time", event.target.value); }} placeholder="09:00" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            종료
            <AppInput value={form.endTime || ""} onChange={(event) => set("endTime", event.target.value)} placeholder="10:00" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-bold">
          메모
          <AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} placeholder="세부 메모를 적어두세요." />
        </label>
        <label className="flex items-center justify-between rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm font-bold text-clover-deep">
          오늘 꼭!
          <input type="checkbox" checked={Boolean(form.todayMust)} onChange={(event) => set("todayMust", event.target.checked)} />
        </label>
        <div className="flex flex-wrap justify-between gap-2">
          {form.id ? <AppButton variant="danger" onClick={() => onDelete(form)}>삭제</AppButton> : <span />}
          <AppButton onClick={() => onSave(form)}>저장</AppButton>
        </div>
      </div>
    </Modal>
  );
}

export default function SchedulePage() {
  const today = toDateKey(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const defaultDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;
  const [data, setData] = useState(getAllData());
  const [selectedDateState, setSelectedDateState] = useState(defaultDate);
  const [quickText, setQuickText] = useState("09:00~12:00 밥\n12:00~13:00 술");
  const [editing, setEditing] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : selectedDateState;
  const initial = new Date(`${selectedDate}T00:00:00`);
  const [calendarMonth, setCalendarMonth] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const load = () => setData(getAllData());
  const setSelectedDate = (date) => {
    setSelectedDateState(date);
    const next = new URLSearchParams(searchParams);
    next.set("date", date);
    setSearchParams(next, { replace: true });
  };

  const monthItems = useMemo(() => getMonthCalendarItems(data, calendarMonth.year, calendarMonth.month), [data, calendarMonth]);
  const scheduleItems = useMemo(() => normalizeScheduleItems(data, selectedDate), [data, selectedDate]);

  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    load();
  };

  const addSchedule = () => setEditing(emptySchedule(selectedDate));

  const saveSchedule = (form) => {
    if (!form.title?.trim()) return;
    persist((next) => {
      if (form.collection === "todos") {
        next.todos = (next.todos || []).map((todo) =>
          todo.id === form.id
            ? {
                ...todo,
                title: form.title.trim(),
                category: form.category || "일정",
                project: form.category || "일정",
                projectName: form.category || "일정",
                startTime: form.startTime || form.time || "",
                dueTime: form.startTime || form.time || "",
                endTime: form.endTime || "",
                memo: form.memo || "",
                todayMust: Boolean(form.todayMust),
                updatedAt: selectedDate
              }
            : todo
        );
      } else {
        const payload = {
          id: form.id || makeId("event"),
          title: form.title.trim(),
          date: selectedDate,
          time: form.startTime || form.time || "",
          startTime: form.startTime || form.time || "",
          endTime: form.endTime || "",
          category: form.category || "일정",
          memo: form.memo || "",
          todayMust: Boolean(form.todayMust),
          completed: Boolean(form.completed),
          createdAt: form.createdAt || selectedDate,
          updatedAt: selectedDate
        };
        next.events = form.id
          ? (next.events || []).map((event) => event.id === form.id ? payload : event)
          : [payload, ...(next.events || [])];
      }
    });
    setEditing(null);
  };

  const deleteSchedule = (item) => {
    persist((next) => {
      moveToTrash(next, item.collection || "events", item);
    });
    setEditing(null);
  };

  const completeSchedule = (item) => {
    persist((next) => {
      if (item.collection === "todos") {
        next.todos = (next.todos || []).map((todo) => todo.id === item.id ? { ...todo, completed: true, completedAt: selectedDate, updatedAt: selectedDate } : todo);
      } else if (item.collection === "events") {
        next.events = (next.events || []).map((event) => event.id === item.id ? { ...event, completed: true, completedAt: selectedDate, updatedAt: selectedDate } : event);
      } else {
        next[item.collection] = (next[item.collection] || []).map((entry) => entry.id === item.id ? { ...entry, completed: true, completedAt: selectedDate, updatedAt: selectedDate } : entry);
      }
    });
  };

  const applyQuickText = () => {
    const parsed = parseQuickLines(quickText);
    if (!parsed.length) return;
    persist((next) => {
      const created = parsed.map((item) => ({
        id: makeId("event"),
        title: item.title,
        date: selectedDate,
        time: item.startTime,
        startTime: item.startTime,
        endTime: item.endTime,
        category: "일정",
        memo: "",
        completed: false,
        createdAt: selectedDate,
        updatedAt: selectedDate
      }));
      next.events = [...created, ...(next.events || [])];
    });
  };

  return (
    <>
      <div className="mx-auto max-w-[1180px]">
        <PageHeader eyebrow="SCHEDULE" title="스케줄">
          <AppButton variant="soft" onClick={addSchedule}>+ 빠른 추가</AppButton>
        </PageHeader>
        <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">월간 일정과 선택한 날짜 일정을 한눈에 관리하세요.</p>

        <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(420px,1.05fr)]">
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
              setCalendarMonth({ year: initial.getFullYear(), month: initial.getMonth() });
              setSelectedDate(today);
            }}
            title={`${calendarMonth.month + 1}월 일정`}
            subtitle="월간 일정과 선택한 날짜"
          >
            <div className="flex flex-wrap gap-3 text-xs font-black text-clover-sub">
              {categoryOptions.map((category) => (
                <span key={category} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${category === "업무" ? "bg-sky-400" : category === "개인" ? "bg-violet-400" : category === "학습" ? "bg-orange-400" : category === "기타" ? "bg-slate-400" : "bg-emerald-400"}`} />
                  {category}
                </span>
              ))}
            </div>
          </HomeMonthCalendar>

          <ScheduleList
            selectedDate={selectedDate}
            items={scheduleItems}
            onAdd={addSchedule}
            onEdit={setEditing}
            onDelete={deleteSchedule}
            onComplete={completeSchedule}
          />
        </div>

        <div className="mt-4">
          <TimelineEditor
            selectedDate={selectedDate}
            items={scheduleItems}
            quickText={quickText}
            onQuickText={setQuickText}
            onApplyQuick={applyQuickText}
            onEdit={setEditing}
            onDelete={deleteSchedule}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails((value) => !value)}
          />
        </div>
      </div>

      {editing && (
        <ScheduleEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSave={saveSchedule}
          onDelete={deleteSchedule}
        />
      )}
    </>
  );
}

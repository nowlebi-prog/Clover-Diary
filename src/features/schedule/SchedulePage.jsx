import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const categories = ["PPT", "신사업", "개인", "갭이어", "기타"];
const categoryMeta = {
  PPT: { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700 border-sky-100", block: "border-sky-200 bg-sky-50/80 text-sky-950" },
  신사업: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-100", block: "border-emerald-200 bg-emerald-50/80 text-emerald-950" },
  개인: { dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-100", block: "border-violet-200 bg-violet-50/80 text-violet-950" },
  갭이어: { dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-100", block: "border-teal-200 bg-teal-50/80 text-teal-950" },
  기타: { dot: "bg-slate-400", chip: "bg-slate-50 text-slate-700 border-slate-100", block: "border-slate-200 bg-slate-50/90 text-slate-950" }
};
const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const hours = Array.from({ length: 16 }, (_, index) => index + 8);
const dateFields = {
  events: "date",
  todos: "dueDate",
  payments: "expectedDate",
  expenses: "date",
  contentPlans: "publishDate"
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const titleOf = (item) => item.title || item.project || item.name || item.service || "이름 없는 일정";
const clampCategory = (value) => categories.includes(value) ? value : "기타";
const formatTime = (value) => {
  if (!value) return "";
  const [hour = "", minute = "00"] = String(value).split(":");
  if (!hour) return "";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};
const timeText = (item) => {
  if (item.isAllDay || item.allDay) return "종일";
  const start = formatTime(item.startTime || item.time || item.dueTime);
  const end = formatTime(item.endTime);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return "시간 미정";
};
const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};
const monthCells = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    return {
      date: key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      weekday: date.getDay(),
      isToday: key === toDateKey(new Date())
    };
  });
};

const normalizeCategory = (item, fallback = "기타") => {
  const raw = item.scheduleCategory || item.category || item.projectName || item.project || fallback;
  if (String(raw).includes("PPT")) return "PPT";
  if (String(raw).includes("사업")) return "신사업";
  if (String(raw).includes("갭")) return "갭이어";
  if (String(raw).includes("개인")) return "개인";
  return clampCategory(raw);
};

const fromCollection = (items, collection, dateField, fallbackCategory) =>
  (items || [])
    .filter((item) => !item.completed)
    .map((item) => {
      const date = item[dateField] || item.date || null;
      return {
        ...item,
        collection,
        date,
        scheduleDate: date,
        title: titleOf(item),
        category: normalizeCategory(item, fallbackCategory),
        startTime: item.allDay ? "" : (item.startTime || item.time || item.dueTime || ""),
        endTime: item.allDay ? "" : (item.endTime || ""),
        isAllDay: Boolean(item.allDay || item.isAllDay),
        isUnscheduled: Boolean(item.isUnscheduled || !date),
        status: item.status || "todo"
      };
    });

const getScheduleItems = (data) => {
  const items = [
    ...fromCollection(data.events, "events", "date", "기타"),
    ...fromCollection(data.todos, "todos", "dueDate", "PPT"),
    ...fromCollection(data.payments, "payments", "expectedDate", "갭이어"),
    ...fromCollection(data.expenses, "expenses", "date", "기타"),
    ...fromCollection(data.contentPlans, "contentPlans", "publishDate", "PPT")
  ];

  (data.campaigns || []).filter((item) => !item.completed).forEach((item) => {
    if (item.applyDueDate) items.push({ ...item, id: `${item.id}-apply`, originalId: item.id, collection: "campaigns", dateField: "applyDueDate", date: item.applyDueDate, scheduleDate: item.applyDueDate, title: `${titleOf(item)} 신청`, category: normalizeCategory(item, "기타"), startTime: "", endTime: "", isAllDay: false, isUnscheduled: false });
    if (item.uploadDueDate) items.push({ ...item, id: `${item.id}-upload`, originalId: item.id, collection: "campaigns", dateField: "uploadDueDate", date: item.uploadDueDate, scheduleDate: item.uploadDueDate, title: `${titleOf(item)} 업로드`, category: normalizeCategory(item, "기타"), startTime: "", endTime: "", isAllDay: false, isUnscheduled: false });
  });

  return items.sort((a, b) => (a.date || "9999-99-99").localeCompare(b.date || "9999-99-99") || (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
};

const emptySchedule = (selectedDate, unscheduled = false) => ({
  collection: "events",
  title: "",
  category: "기타",
  date: unscheduled ? "" : selectedDate,
  scheduleDate: unscheduled ? "" : selectedDate,
  startTime: unscheduled ? "" : "09:00",
  endTime: unscheduled ? "" : "10:00",
  isAllDay: false,
  isUnscheduled: unscheduled,
  timeMode: unscheduled ? "unscheduled" : "timed",
  memo: "",
  status: "todo",
  priority: "normal",
  completed: false
});

const parseQuickLines = (text) => text
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^(\d{1,2}):(\d{2})\s*(?:~|-)\s*(\d{1,2}):(\d{2})\s+(.+)$/);
    if (!match) return null;
    const [, sh, sm, eh, em, title] = match;
    return {
      startTime: `${sh.padStart(2, "0")}:${sm}`,
      endTime: `${eh.padStart(2, "0")}:${em}`,
      title: title.trim()
    };
  })
  .filter(Boolean);

function CategoryChip({ category }) {
  const meta = categoryMeta[category] || categoryMeta["기타"];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${meta.chip}`}>{category}</span>;
}

function FilterChips({ value, counts, unscheduledCount, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {["전체", ...categories].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition ${value === item ? "border-clover-deep bg-clover-deep text-white" : "border-clover-line bg-white/75 text-clover-sub hover:bg-white"}`}
        >
          {item !== "전체" && <span className={`h-2 w-2 rounded-full ${categoryMeta[item]?.dot || "bg-slate-300"}`} />}
          {item}
          {item !== "전체" && <span className="text-[10px] opacity-70">{counts[item] || 0}</span>}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange("날짜 미정")}
        className={`rounded-full border px-4 py-2 text-xs font-black transition ${value === "날짜 미정" ? "border-amber-300 bg-amber-100 text-amber-800" : "border-amber-100 bg-amber-50 text-amber-700"}`}
      >
        날짜 미정 {unscheduledCount}개
      </button>
    </div>
  );
}

function MonthCalendar({ year, month, selectedDate, items, filter, onSelect, onMove, onToday }) {
  const cells = monthCells(year, month);
  const byDate = items.reduce((map, item) => {
    if (!item.date || item.isUnscheduled) return map;
    if (filter !== "전체" && filter !== "날짜 미정" && item.category !== filter) return map;
    map[item.date] = [...(map[item.date] || []), item];
    return map;
  }, {});

  return (
    <GlassCard className="overflow-hidden rounded-[22px] border border-clover-line bg-white/88 p-0">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-xl font-black text-clover-ink">{year}년 {month + 1}월</h2>
          <p className="text-xs font-bold text-clover-sub">월간 일정과 선택한 날짜</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMove(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-clover-line bg-white text-lg font-black text-clover-sub">‹</button>
          <button type="button" onClick={onToday} className="rounded-full border border-clover-line bg-white px-4 py-2 text-xs font-black text-clover-sub">오늘</button>
          <button type="button" onClick={() => onMove(1)} className="grid h-10 w-10 place-items-center rounded-full border border-clover-line bg-white text-lg font-black text-clover-sub">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-y border-clover-line bg-white/70 text-center text-xs font-black text-clover-sub">
        {dayLabels.map((day, index) => <span key={day} className={`py-3 ${index === 0 ? "text-red-400" : index === 6 ? "text-sky-500" : ""}`}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayItems = byDate[cell.date] || [];
          const selected = selectedDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelect(cell.date)}
              className={`min-h-[72px] border-b border-r border-clover-line/80 p-2 text-left transition hover:bg-emerald-50/40 md:min-h-[86px] ${!cell.inMonth ? "bg-slate-50/45 text-slate-300" : "bg-white/55 text-clover-ink"} ${selected ? "bg-emerald-50/70 ring-2 ring-inset ring-clover-deep/60" : ""}`}
            >
              <span className={`mb-1 inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-black ${cell.isToday ? "bg-clover-ink text-white" : cell.weekday === 0 ? "text-red-400" : cell.weekday === 6 ? "text-sky-500" : ""}`}>{cell.day}</span>
              <div className="grid gap-1">
                {dayItems.slice(0, 2).map((item) => (
                  <span key={`${item.collection}-${item.id}`} className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-black ${categoryMeta[item.category]?.chip || categoryMeta["기타"].chip}`}>
                    {item.title}
                  </span>
                ))}
                {dayItems.length > 2 && <span className="text-[10px] font-black text-clover-deep">+{dayItems.length - 2}개 더</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-clover-line bg-white/70 px-5 py-3 text-xs font-black text-clover-sub">
        {categories.map((category) => <span key={category} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${categoryMeta[category]?.dot}`} />{category}</span>)}
      </div>
    </GlassCard>
  );
}

function ScheduleRow({ item, onComplete, onEdit, onDelete, extraAction }) {
  return (
    <article className="grid grid-cols-[auto_78px_minmax(0,1fr)_auto] items-center gap-3 border-b border-clover-line/70 px-3 py-3 text-sm last:border-0 max-sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <input type="checkbox" checked={false} onChange={() => onComplete(item)} className="h-4 w-4 accent-clover-deep" aria-label="완료" />
      <span className="text-xs font-black text-clover-sub max-sm:hidden">{timeText(item)}</span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${categoryMeta[item.category]?.dot || "bg-slate-300"}`} />
          <b className="truncate text-clover-ink">{item.title}</b>
          <CategoryChip category={item.category} />
        </div>
        {item.memo && <p className="mt-1 truncate text-xs font-bold text-clover-sub">{item.memo}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {extraAction}
        <button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-clover-line bg-white px-2.5 py-1.5 text-xs font-black text-clover-sub">수정</button>
        <button type="button" onClick={() => onDelete(item)} className="rounded-lg border border-clover-line bg-white px-2.5 py-1.5 text-xs font-black text-clover-sub">삭제</button>
      </div>
    </article>
  );
}

function GroupBox({ title, tone = "mint", items, children }) {
  const colors = {
    rose: "border-rose-100 bg-rose-50/35 text-rose-600",
    blue: "border-sky-100 bg-sky-50/45 text-sky-700",
    violet: "border-violet-100 bg-violet-50/45 text-violet-700",
    mint: "border-emerald-100 bg-emerald-50/40 text-clover-deep"
  };
  return (
    <div className="overflow-hidden rounded-[16px] border border-clover-line bg-white/70">
      <div className={`border-b px-3 py-2 text-xs font-black ${colors[tone] || colors.mint}`}>{title}</div>
      {items.length ? children : <p className="px-3 py-4 text-sm font-bold text-clover-sub">해당 일정이 없어요.</p>}
    </div>
  );
}

function SelectedDateCard({ selectedDate, groups, onAdd, onComplete, onEdit, onDelete, onSetTime }) {
  const date = new Date(`${selectedDate}T00:00:00`);
  const title = date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/88 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle>{title} 일정</SectionTitle>
        <button type="button" onClick={onAdd} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-clover-deep">+ 일정 추가</button>
      </div>
      <div className="grid gap-3">
        <GroupBox title="종일" tone="rose" items={groups.allDay}>
          {groups.allDay.map((item) => <ScheduleRow key={`${item.collection}-${item.id}`} item={item} onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} />)}
        </GroupBox>
        <GroupBox title="시간 있음" tone="blue" items={groups.timed}>
          {groups.timed.map((item) => <ScheduleRow key={`${item.collection}-${item.id}`} item={item} onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} />)}
        </GroupBox>
        <GroupBox title="시간 미정" tone="violet" items={groups.noTime}>
          {groups.noTime.map((item) => (
            <ScheduleRow
              key={`${item.collection}-${item.id}`}
              item={item}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              extraAction={<button type="button" onClick={() => onSetTime(item)} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-clover-deep">시간 정하기</button>}
            />
          ))}
        </GroupBox>
      </div>
    </GlassCard>
  );
}

function Timeline({ selectedDate, items, quickText, onQuickText, onApplyQuick, onEdit, onDelete }) {
  const timedItems = items.filter((item) => item.startTime && item.endTime && !item.isAllDay && !item.isUnscheduled);
  const current = new Date();
  const isToday = selectedDate === toDateKey(current);
  const currentTop = ((current.getHours() - 8) * 60 + current.getMinutes()) * 0.9;

  return (
    <GlassCard className="rounded-[22px] border border-clover-line bg-white/88 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-end gap-3">
          <SectionTitle>타임라인</SectionTitle>
          <span className="text-sm font-black text-clover-sub">{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일</span>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-sub">시간 있는 일정만 표시</span>
      </div>

      <div className="mb-5 rounded-[16px] border border-clover-line bg-white/70 p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-black">
            빠른 입력
            <AppTextarea
              value={quickText}
              onChange={(event) => onQuickText(event.target.value)}
              placeholder={"09:00~12:00 밥\n12:00~13:00 술"}
              className="min-h-[88px] bg-white/80 text-sm"
            />
          </label>
          <AppButton onClick={onApplyQuick}>자동 반영</AppButton>
        </div>
        <p className="mt-2 text-xs font-bold text-clover-sub">예시: 09:00~10:00 회의. 입력한 일정은 아래 타임라인에 바로 반영돼요.</p>
      </div>

      <div className="relative">
        {isToday && current.getHours() >= 8 && current.getHours() <= 23 && (
          <div className="pointer-events-none absolute left-[58px] right-0 z-20 flex items-center" style={{ top: `${Math.max(0, currentTop)}px` }}>
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{formatTime(`${current.getHours()}:${current.getMinutes()}`)}</span>
            <span className="h-px flex-1 bg-red-400" />
          </div>
        )}
        {hours.map((hour) => {
          const hourItems = timedItems.filter((item) => Number((item.startTime || "99").slice(0, 2)) === hour);
          return (
            <div key={hour} className="grid min-h-[54px] grid-cols-[52px_1fr] gap-4 border-b border-dashed border-slate-200">
              <div className="pt-3 text-right text-xs font-black text-clover-sub">{String(hour).padStart(2, "0")}:00</div>
              <div className="grid content-start gap-2 py-2">
                {hourItems.map((item) => (
                  <article key={`${item.collection}-${item.id}`} className={`grid grid-cols-[130px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-sm max-sm:grid-cols-[1fr_auto] ${categoryMeta[item.category]?.block || categoryMeta["기타"].block}`}>
                    <span className="text-xs font-black max-sm:hidden">{timeText(item)}</span>
                    <b className="min-w-0 truncate">{item.title}</b>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onEdit(item)} className="rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-black">수정</button>
                      <button type="button" onClick={() => onDelete(item)} className="rounded-lg bg-white/80 px-2.5 py-1.5 text-xs font-black">삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
        {!timedItems.length && <p className="mt-3 rounded-[14px] bg-white/55 p-4 text-sm font-bold text-clover-sub">시간이 정해진 일정이 아직 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function UnscheduledPanel({ items, selectedDate, onAdd, onToday, onSetDate, onEdit, onDelete, onComplete }) {
  return (
    <GlassCard className="rounded-[22px] border border-amber-100 bg-amber-50/35 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <SectionTitle>날짜 미정</SectionTitle>
          <p className="text-xs font-bold text-clover-sub">언젠가 해야 할 일</p>
        </div>
        <button type="button" onClick={onAdd} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-800">+ 날짜 미정 추가</button>
      </div>
      <div className="grid gap-2">
        {items.slice(0, 8).map((item) => (
          <ScheduleRow
            key={`${item.collection}-${item.id}`}
            item={item}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            extraAction={(
              <>
                <button type="button" onClick={() => onToday(item, selectedDate)} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-clover-deep">오늘로</button>
                <button type="button" onClick={() => onSetDate(item)} className="rounded-lg border border-clover-line bg-white px-2.5 py-1.5 text-xs font-black text-clover-sub">날짜 정하기</button>
              </>
            )}
          />
        ))}
        {!items.length && <p className="rounded-[14px] bg-white/55 p-4 text-sm font-bold text-clover-sub">날짜 미정 일정이 없어요.</p>}
      </div>
      {items.length > 8 && <p className="mt-3 text-center text-xs font-black text-clover-sub">+{items.length - 8}개 더 있어요.</p>}
    </GlassCard>
  );
}

function ScheduleEditor({ item, selectedDate, onClose, onSave, onDelete }) {
  const initialMode = item?.isUnscheduled ? "unscheduled" : item?.isAllDay || item?.allDay ? "allDay" : item?.startTime || item?.time ? "timed" : "noTime";
  const [form, setForm] = useState({ ...emptySchedule(selectedDate), ...item, timeMode: item?.timeMode || initialMode });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const timeMode = form.timeMode || "timed";

  useEffect(() => {
    setForm((current) => {
      if (timeMode === "unscheduled") return { ...current, date: "", scheduleDate: "", startTime: "", endTime: "", isAllDay: false, isUnscheduled: true };
      if (timeMode === "allDay") return { ...current, date: current.date || selectedDate, scheduleDate: current.scheduleDate || selectedDate, startTime: "", endTime: "", isAllDay: true, isUnscheduled: false };
      if (timeMode === "noTime") return { ...current, date: current.date || selectedDate, scheduleDate: current.scheduleDate || selectedDate, startTime: "", endTime: "", isAllDay: false, isUnscheduled: false };
      return { ...current, date: current.date || selectedDate, scheduleDate: current.scheduleDate || selectedDate, isAllDay: false, isUnscheduled: false };
    });
  }, [timeMode, selectedDate]);

  return (
    <Modal title={form.id ? "일정 상세 수정" : "일정 추가"} onClose={onClose}>
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm font-bold">
          일정 제목
          <AppInput value={form.title || ""} onChange={(event) => set("title", event.target.value)} placeholder="예: 클라이언트 수정본 전달" autoFocus />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">
            유형
            <AppSelect value={timeMode} onChange={(event) => set("timeMode", event.target.value)}>
              <option value="timed">시간 지정</option>
              <option value="allDay">종일</option>
              <option value="noTime">시간 미정</option>
              <option value="unscheduled">날짜 미정</option>
            </AppSelect>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            분류
            <AppSelect value={form.category || "기타"} onChange={(event) => set("category", event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </AppSelect>
          </label>
        </div>

        {timeMode !== "unscheduled" && (
          <label className="grid gap-1 text-sm font-bold">
            날짜
            <AppInput type="date" value={form.date || form.scheduleDate || selectedDate} onChange={(event) => { set("date", event.target.value); set("scheduleDate", event.target.value); }} />
          </label>
        )}

        {timeMode === "timed" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">시작<AppInput value={form.startTime || form.time || ""} onChange={(event) => { set("startTime", event.target.value); set("time", event.target.value); }} placeholder="09:00" /></label>
            <label className="grid gap-1 text-sm font-bold">종료<AppInput value={form.endTime || ""} onChange={(event) => set("endTime", event.target.value)} placeholder="10:00" /></label>
          </div>
        )}

        <label className="grid gap-1 text-sm font-bold">
          메모
          <AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} placeholder="세부 메모를 적어두세요." />
        </label>

        <label className="flex items-center justify-between rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm font-bold text-clover-deep">
          오늘 꼭!
          <input type="checkbox" checked={Boolean(form.todayMust)} onChange={(event) => set("todayMust", event.target.checked)} />
        </label>

        <div className="flex flex-wrap justify-between gap-2">
          {form.id ? <AppButton variant="danger" onClick={() => onDelete(form)}>삭제</AppButton> : <span />}
          <div className="flex gap-2">
            <AppButton variant="ghost" onClick={onClose}>취소</AppButton>
            <AppButton onClick={() => onSave(form)}>저장</AppButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function SchedulePage() {
  const today = toDateKey(new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDate = searchParams.get("date");
  const defaultDate = queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) ? queryDate : today;
  const [data, setData] = useState(getAllData());
  const [selectedDate, setSelectedDateState] = useState(defaultDate);
  const [month, setMonth] = useState(() => {
    const date = new Date(`${defaultDate}T00:00:00`);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const [filter, setFilter] = useState("전체");
  const [editing, setEditing] = useState(null);
  const [quickText, setQuickText] = useState("09:00~10:30 클라이언트 수정본 전달\n14:00~15:00 콘텐츠 발행 점검");

  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const selectDate = (date) => {
    setSelectedDateState(date);
    const next = new URLSearchParams(searchParams);
    next.set("date", date);
    setSearchParams(next, { replace: true });
  };

  const allItems = useMemo(() => getScheduleItems(data), [data]);
  const filteredItems = filter === "전체" ? allItems : filter === "날짜 미정" ? allItems.filter((item) => item.isUnscheduled) : allItems.filter((item) => item.category === filter);
  const selectedItems = filteredItems.filter((item) => item.date === selectedDate && !item.isUnscheduled);
  const groups = {
    allDay: selectedItems.filter((item) => item.isAllDay),
    timed: selectedItems.filter((item) => item.startTime && item.endTime && !item.isAllDay),
    noTime: selectedItems.filter((item) => !item.startTime && !item.endTime && !item.isAllDay)
  };
  const unscheduledItems = allItems.filter((item) => item.isUnscheduled);
  const counts = allItems.reduce((map, item) => ({ ...map, [item.category]: (map[item.category] || 0) + 1 }), {});

  const persist = (updater) => {
    const next = getAllData();
    updater(next);
    saveAllData(next);
    load();
  };

  const saveItem = (form) => {
    if (!form.title?.trim()) return;
    persist((next) => {
      const date = form.isUnscheduled ? null : (form.date || form.scheduleDate || selectedDate);
      const payload = {
        title: form.title.trim(),
        category: form.category || "기타",
        scheduleCategory: form.category || "기타",
        date,
        scheduleDate: date,
        time: form.isAllDay ? "" : (form.startTime || form.time || ""),
        startTime: form.isAllDay ? "" : (form.startTime || form.time || ""),
        endTime: form.isAllDay ? "" : (form.endTime || ""),
        allDay: Boolean(form.isAllDay),
        isAllDay: Boolean(form.isAllDay),
        isUnscheduled: Boolean(form.isUnscheduled),
        memo: form.memo || "",
        todayMust: Boolean(form.todayMust),
        completed: Boolean(form.completed),
        updatedAt: today
      };

      if (form.collection === "todos") {
        next.todos = (next.todos || []).map((todo) => todo.id === form.id ? { ...todo, ...payload, dueDate: date, dueTime: payload.startTime, project: payload.category, projectName: payload.category } : todo);
      } else if (form.collection && form.collection !== "events" && next[form.collection]) {
        const realId = form.originalId || form.id;
        const dateField = form.dateField || dateFields[form.collection] || "date";
        next[form.collection] = (next[form.collection] || []).map((item) => item.id === realId ? { ...item, ...payload, [dateField]: date } : item);
      } else {
        const event = {
          id: form.id || makeId("event"),
          createdAt: form.createdAt || today,
          ...payload
        };
        next.events = form.id
          ? (next.events || []).map((item) => item.id === form.id ? event : item)
          : [event, ...(next.events || [])];
      }
    });
    setEditing(null);
  };

  const deleteItem = (item) => {
    persist((next) => {
      const collection = item.collection || "events";
      const id = item.originalId || item.id;
      moveToTrash(next, collection, id);
    });
    setEditing(null);
  };

  const completeItem = (item) => {
    persist((next) => {
      const collection = item.collection || "events";
      const id = item.originalId || item.id;
      next[collection] = (next[collection] || []).map((entry) => entry.id === id ? { ...entry, completed: true, completedAt: selectedDate, updatedAt: today } : entry);
    });
  };

  const assignDate = (item, date, mode = "noTime") => {
    saveItem({ ...item, date, scheduleDate: date, isUnscheduled: false, timeMode: mode, isAllDay: false, startTime: mode === "timed" ? item.startTime || "09:00" : "", endTime: mode === "timed" ? item.endTime || "10:00" : "" });
  };

  const applyQuickText = () => {
    const parsed = parseQuickLines(quickText);
    if (!parsed.length) return;
    persist((next) => {
      const events = parsed.map((item) => ({
        id: makeId("event"),
        title: item.title,
        category: "기타",
        scheduleCategory: "기타",
        date: selectedDate,
        scheduleDate: selectedDate,
        time: item.startTime,
        startTime: item.startTime,
        endTime: item.endTime,
        allDay: false,
        isAllDay: false,
        isUnscheduled: false,
        memo: "",
        completed: false,
        createdAt: today,
        updatedAt: today
      }));
      next.events = [...events, ...(next.events || [])];
    });
  };

  const moveMonth = (amount) => {
    setMonth((current) => {
      const next = new Date(current.year, current.month + amount, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <>
      <PageHeader eyebrow="SCHEDULE" title="스케줄">
        <AppButton variant="soft" onClick={() => setEditing(emptySchedule(selectedDate))}>+ 빠른 추가</AppButton>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm font-bold text-clover-sub">월간 일정과 선택한 날짜 일정을 한눈에 관리해요.</p>

      <FilterChips value={filter} counts={counts} unscheduledCount={unscheduledItems.length} onChange={setFilter} />

      <div className="grid gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(420px,1fr)]">
        <MonthCalendar
          year={month.year}
          month={month.month}
          selectedDate={selectedDate}
          items={allItems}
          filter={filter}
          onSelect={selectDate}
          onMove={moveMonth}
          onToday={() => {
            const now = new Date();
            setMonth({ year: now.getFullYear(), month: now.getMonth() });
            selectDate(today);
          }}
        />
        <SelectedDateCard
          selectedDate={selectedDate}
          groups={groups}
          onAdd={() => setEditing(emptySchedule(selectedDate))}
          onComplete={completeItem}
          onEdit={setEditing}
          onDelete={deleteItem}
          onSetTime={(item) => setEditing({ ...item, timeMode: "timed", startTime: item.startTime || "09:00", endTime: item.endTime || "10:00" })}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
        <Timeline
          selectedDate={selectedDate}
          items={selectedItems}
          quickText={quickText}
          onQuickText={setQuickText}
          onApplyQuick={applyQuickText}
          onEdit={setEditing}
          onDelete={deleteItem}
        />
        <UnscheduledPanel
          items={unscheduledItems}
          selectedDate={selectedDate}
          onAdd={() => setEditing(emptySchedule(selectedDate, true))}
          onToday={(item, date) => assignDate(item, date, "noTime")}
          onSetDate={(item) => setEditing({ ...item, timeMode: "noTime", date: selectedDate, scheduleDate: selectedDate, isUnscheduled: false })}
          onEdit={setEditing}
          onDelete={deleteItem}
          onComplete={completeItem}
        />
      </div>

      {editing && (
        <ScheduleEditor
          item={editing}
          selectedDate={selectedDate}
          onClose={() => setEditing(null)}
          onSave={saveItem}
          onDelete={deleteItem}
        />
      )}
    </>
  );
}

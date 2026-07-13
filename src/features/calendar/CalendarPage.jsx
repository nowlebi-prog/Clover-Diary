import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import MobileWorkCalendar from "../../components/calendar/MobileWorkCalendar";
import Modal from "../../components/common/Modal";
import MonthCalendar from "../../components/dashboard/MonthCalendar";
import PageHeader from "../../components/layout/PageHeader";
import { createEvent, createMoodEntry, getAllData, updateEvent, updateMoodEntry } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const emptyEvent = (date) => ({ title: "", date, time: "09:00", endTime: "", allDay: false, category: "내 일정", memo: "" });

const baseCalendars = [
  { key: "event", label: "내 일정", color: "bg-blue-400", group: "내 캘린더" },
  { key: "todo", label: "할 일", color: "bg-rose-400", group: "관심 캘린더" },
  { key: "content", label: "콘텐츠", color: "bg-sky-400", group: "관심 캘린더" },
  { key: "payment", label: "돈 관리", color: "bg-amber-500", group: "관심 캘린더" },
  { key: "campaign", label: "캠페인", color: "bg-violet-400", group: "관심 캘린더" },
  { key: "recurring", label: "반복 일정", color: "bg-emerald-400", group: "관심 캘린더" }
];

const eventCategories = ["내 일정", "업무", "콘텐츠", "집안일", "정산", "생활", "기타"];

const filterItemsByCalendar = (itemsByDate, enabled) => {
  const next = {};
  Object.entries(itemsByDate).forEach(([date, items]) => {
    const filtered = items.filter((item) => enabled[item.type] !== false);
    if (filtered.length) next[date] = filtered;
  });
  return next;
};

function CalendarFilterPanel({ enabled, onToggle, onAddEvent }) {
  const groups = baseCalendars.reduce((map, item) => {
    map[item.group] = [...(map[item.group] || []), item];
    return map;
  }, {});

  const toggleGroup = (items, checked) => {
    items.forEach((item) => onToggle(item.key, checked));
  };

  return (
    <aside className="glass rounded-[28px] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black">캘린더</h2>
        <span className="text-xl font-black text-clover-sub">⋮</span>
      </div>
      <AppButton className="mb-6 w-full" variant="soft" onClick={onAddEvent}>일정등록</AppButton>

      <div className="grid gap-6">
        {Object.entries(groups).map(([group, items]) => {
          const allChecked = items.every((item) => enabled[item.key] !== false);
          return (
            <section key={group} className="grid gap-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => toggleGroup(items, !allChecked)} className="text-sm font-black text-clover-ink">
                  {allChecked ? "⌄" : "›"} {group}
                </button>
                <span className="text-sm text-clover-sub">✎</span>
              </div>
              <div className="grid gap-2 pl-4">
                {items.map((item) => (
                  <label key={item.key} className="flex items-center justify-between rounded-2xl px-2 py-1 text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabled[item.key] !== false}
                        onChange={(event) => onToggle(item.key, event.target.checked)}
                      />
                      {item.label}
                    </span>
                    <i className={`h-3 w-3 rounded-full ${item.color}`} />
                  </label>
                ))}
              </div>
            </section>
          );
        })}

        <section className="border-t border-clover-line pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-clover-ink">전사 캘린더</p>
            <span className="h-3 w-3 rounded-full bg-stone-500" />
          </div>
          <label className="mt-3 flex items-center gap-2 pl-4 text-sm font-bold text-clover-sub">
            <input type="checkbox" disabled />
            전사일정
          </label>
        </section>
      </div>
    </aside>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [data, setData] = useState(getAllData());
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(toDateKey(now));
  const [editing, setEditing] = useState(null);
  const [enabledCalendars, setEnabledCalendars] = useState(() => Object.fromEntries(baseCalendars.map((item) => [item.key, true])));

  const load = () => setData(getAllData());

  useEffect(() => {
    const openQuick = (event) => {
      if (!event.detail || event.detail === "event") setEditing(emptyEvent(selectedDate));
    };
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", openQuick);
    window.addEventListener("clover-open-quick-add", openQuick);
    return () => {
      window.removeEventListener("clover-data-change", load);
      window.removeEventListener("clover-quick-add", openQuick);
      window.removeEventListener("clover-open-quick-add", openQuick);
    };
  }, [selectedDate]);

  const rawItemsByDate = useMemo(() => getMonthCalendarItems(data, cursor.year, cursor.month), [data, cursor]);
  const itemsByDate = useMemo(() => filterItemsByCalendar(rawItemsByDate, enabledCalendars), [rawItemsByDate, enabledCalendars]);
  const selectedItems = itemsByDate[selectedDate] || [];

  const moveMonth = (amount) => {
    const date = new Date(cursor.year, cursor.month + amount, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

  const goToday = () => {
    const date = new Date();
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
    setSelectedDate(toDateKey(date));
  };

  const save = () => {
    if (!editing.title?.trim()) return;
    if (editing.id) updateEvent(editing.id, editing);
    else createEvent(editing);
    setEditing(null);
    load();
  };

  const saveMood = (mood) => {
    const existing = (data.moodEntries || []).find((item) => item.date === mood.date);
    if (existing) updateMoodEntry(existing.id, mood);
    else createMoodEntry(mood);
    load();
  };

  const toggleCalendar = (key, checked) => {
    setEnabledCalendars((current) => ({ ...current, [key]: checked }));
  };

  return (
    <>
      <div className="md:hidden">
        <MobileWorkCalendar
          cursor={cursor}
          selectedDate={selectedDate}
          selectedItems={selectedItems}
          itemsByDate={itemsByDate}
          data={data}
          onSelectDate={setSelectedDate}
          onMoveMonth={moveMonth}
          onToday={goToday}
          onAddEvent={() => setEditing(emptyEvent(selectedDate))}
          onSaveMood={saveMood}
        />
      </div>

      <div className="hidden md:block">
        <PageHeader eyebrow="Calendar" title="월간 캘린더">
          <AppButton onClick={() => setEditing(emptyEvent(selectedDate))}>+ 일정</AppButton>
        </PageHeader>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/55 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-clover-sub">Selected Day</p>
            <p className="text-lg font-black text-clover-ink">{selectedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-clover-sub">항목 {selectedItems.length}개</span>
            <Link to={`/life?tab=todos&date=${selectedDate}`}>
              <AppButton variant="soft">전체 할일 보기</AppButton>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
          <CalendarFilterPanel
            enabled={enabledCalendars}
            onToggle={toggleCalendar}
            onAddEvent={() => setEditing(emptyEvent(selectedDate))}
          />
          <MonthCalendar
            year={cursor.year}
            month={cursor.month}
            itemsByDate={itemsByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMoveMonth={moveMonth}
            onToday={goToday}
          />
        </div>
      </div>

      <Modal title={editing ? (editing.id ? "일정 수정" : "일정 추가") : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">제목<AppInput value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">시작<AppInput type="time" value={editing.time || ""} disabled={editing.allDay} onChange={(event) => setEditing({ ...editing, time: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">종료<AppInput type="time" value={editing.endTime || ""} disabled={editing.allDay} onChange={(event) => setEditing({ ...editing, endTime: event.target.value })} /></label>
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
              하루종일
              <input type="checkbox" checked={Boolean(editing.allDay)} onChange={(event) => setEditing({ ...editing, allDay: event.target.checked, time: "", endTime: "" })} />
            </label>
            <label className="grid gap-1 text-sm font-bold">카테고리
              <AppSelect value={editing.category || "내 일정"} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                {eventCategories.map((item) => <option key={item}>{item}</option>)}
              </AppSelect>
            </label>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={editing.memo || ""} onChange={(event) => setEditing({ ...editing, memo: event.target.value })} /></label>
            <AppButton onClick={save}>저장</AppButton>
          </div>
        )}
      </Modal>
    </>
  );
}

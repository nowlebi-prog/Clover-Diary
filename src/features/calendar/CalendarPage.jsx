import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import MobileWorkCalendar from "../../components/calendar/MobileWorkCalendar";
import Modal from "../../components/common/Modal";
import DayDetailPanel from "../../components/dashboard/DayDetailPanel";
import MonthCalendar from "../../components/dashboard/MonthCalendar";
import PageHeader from "../../components/layout/PageHeader";
import { createEvent, createMoodEntry, deleteEvent, getAllData, updateEvent, updateMoodEntry } from "../../lib/storage/localStorageAdapter";
import { getMonthCalendarItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const emptyEvent = (date) => ({ title: "", date, time: "09:00", category: "개인", memo: "" });

export default function CalendarPage() {
  const now = new Date();
  const [data, setData] = useState(getAllData());
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(toDateKey(now));
  const [editing, setEditing] = useState(null);

  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", () => setEditing(emptyEvent(selectedDate)));
    window.addEventListener("clover-open-quick-add", (event) => {
      if (event.detail === "event") setEditing(emptyEvent(selectedDate));
    });
    return () => {
      window.removeEventListener("clover-data-change", load);
    };
  }, [selectedDate]);

  const itemsByDate = useMemo(() => getMonthCalendarItems(data, cursor.year, cursor.month), [data, cursor]);
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
        <PageHeader eyebrow="Calendar" title="Monthly calendar">
          <AppButton onClick={() => setEditing(emptyEvent(selectedDate))}>+ Event</AppButton>
        </PageHeader>
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <MonthCalendar
            year={cursor.year}
            month={cursor.month}
            itemsByDate={itemsByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onMoveMonth={moveMonth}
            onToday={goToday}
          />
          <DayDetailPanel
            date={selectedDate}
            items={selectedItems}
            onAddEvent={() => setEditing(emptyEvent(selectedDate))}
            onEditEvent={setEditing}
            onDeleteEvent={(id) => deleteEvent(id)}
          />
        </div>
      </div>

      <Modal title={editing ? (editing.id ? "Edit event" : "Add event") : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">Title<AppInput value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">Date<AppInput type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">Time<AppInput type="time" value={editing.time || ""} onChange={(event) => setEditing({ ...editing, time: event.target.value })} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">Category
              <AppSelect value={editing.category || "개인"} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                {["개인", "업무", "콘텐츠", "체험단", "정산", "생활", "기타"].map((item) => <option key={item}>{item}</option>)}
              </AppSelect>
            </label>
            <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={editing.memo || ""} onChange={(event) => setEditing({ ...editing, memo: event.target.value })} /></label>
            <AppButton onClick={save}>Save</AppButton>
          </div>
        )}
      </Modal>
    </>
  );
}

import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import SectionTitle from "../common/SectionTitle";

const hours = Array.from({ length: 24 }, (_, index) => index);

const pad = (hour) => `${String(hour).padStart(2, "0")}:00`;

const hourOf = (item) => {
  const raw = item.time || item.startTime || item.startedAt;
  if (!raw) return null;
  if (typeof raw === "number") return new Date(raw).getHours();
  const match = String(raw).match(/^(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

const endHourOf = (item) => {
  const raw = item.endTime;
  if (!raw) return null;
  const match = String(raw).match(/^(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

export default function DurationTimeline({ items = [], date, onSaveEntries }) {
  const [drafts, setDrafts] = useState({});
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [rangeTitle, setRangeTitle] = useState("");
  const dirtyEntries = useMemo(() => Object.entries(drafts).filter(([, value]) => value.trim()), [drafts]);
  const rangeMin = dragStart === null || dragEnd === null ? null : Math.min(dragStart, dragEnd);
  const rangeMax = dragStart === null || dragEnd === null ? null : Math.max(dragStart, dragEnd);

  const byHour = hours.map((hour) => ({
    hour,
    items: items.filter((item) => {
      const start = hourOf(item);
      const end = endHourOf(item);
      if (start === null) return false;
      return end ? hour >= start && hour < end : hour === start;
    })
  }));

  const saveDrafts = () => {
    const entries = dirtyEntries.map(([hour, title]) => ({
      startHour: Number(hour),
      endHour: Number(hour) + 1,
      title: title.trim()
    }));
    if (rangeMin !== null && rangeMax !== null && rangeTitle.trim()) {
      entries.push({
        startHour: rangeMin,
        endHour: Math.min(24, rangeMax + 1),
        title: rangeTitle.trim()
      });
    }
    if (!entries.length) return;
    onSaveEntries?.(entries);
    setDrafts({});
    setDragStart(null);
    setDragEnd(null);
    setRangeTitle("");
  };

  return (
    <section className="glass relative rounded-[28px] bg-[#FFFDF5]/75 p-5">
      <SectionTitle action={<AppButton variant="soft" onClick={saveDrafts}>타임블록 저장</AppButton>}>오늘 일정 / 타임블록</SectionTitle>

      {rangeMin !== null && rangeMax !== null && (
        <div className="mb-4 rounded-[22px] bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-700">{pad(rangeMin)} - {pad(Math.min(24, rangeMax + 1))}</p>
          <div className="mt-2 flex gap-2">
            <AppInput value={rangeTitle} onChange={(event) => setRangeTitle(event.target.value)} placeholder="이 시간에 할 일을 적어주세요." />
            <AppButton onClick={saveDrafts}>저장</AppButton>
          </div>
        </div>
      )}

      <div className="mt-2 grid gap-0">
        {byHour.map(({ hour, items: hourItems }) => {
          const inRange = rangeMin !== null && rangeMax !== null && hour >= rangeMin && hour <= rangeMax;
          return (
            <div
              key={hour}
              onMouseDown={() => {
                setDragStart(hour);
                setDragEnd(hour);
              }}
              onMouseEnter={() => {
                if (dragStart !== null) setDragEnd(hour);
              }}
              onMouseUp={() => setDragEnd(hour)}
              onTouchStart={() => {
                setDragStart(hour);
                setDragEnd(hour);
              }}
              className={`grid min-h-14 cursor-crosshair grid-cols-[48px_1fr] gap-3 border-b border-clover-line/70 ${inRange ? "bg-emerald-100/45" : ""}`}
            >
              <div className="pt-2 text-right text-xs font-black text-clover-sub">{pad(hour)}</div>
              <div className="relative py-1">
                <span className="absolute left-0 top-0 h-full w-px bg-clover-line" />
                <div className="ml-4 grid gap-1">
                  {hourItems.map((item, index) => (
                    <article key={`${item.id || item.title}-${index}`} className="rounded-2xl bg-white/70 px-3 py-2 text-sm">
                      <b>{item.title}</b>
                      {(item.endTime || item.minutes) && <span className="ml-2 text-xs font-bold text-clover-sub">{item.endTime ? `${item.time || item.startTime}-${item.endTime}` : `${item.minutes}분`}</span>}
                    </article>
                  ))}
                  <input
                    value={drafts[hour] || ""}
                    onChange={(event) => setDrafts((current) => ({ ...current, [hour]: event.target.value }))}
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    placeholder="바로 입력"
                    className="min-h-10 rounded-2xl border border-transparent bg-white/35 px-3 text-sm text-clover-text outline-none transition placeholder:text-clover-sub/60 focus:border-clover-primary focus:bg-white/80 focus:ring-2 focus:ring-clover-primary/30"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-bold text-clover-sub">
        시간을 드래그해서 영역을 잡거나, 각 시간 줄에 바로 입력할 수 있어요. 예: 9시부터 12시까지 드래그하면 09:00-12:00 블록으로 저장됩니다.
      </p>
    </section>
  );
}

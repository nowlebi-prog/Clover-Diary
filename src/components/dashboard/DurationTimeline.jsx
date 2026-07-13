import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import SectionTitle from "../common/SectionTitle";

const hours = Array.from({ length: 24 }, (_, index) => index);

const padHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
const padTime = (hour, minute = 0) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

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

const parseQuickTimeline = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const entries = [];
  const invalid = [];

  lines.forEach((line) => {
    const match = line.match(/^(\d{1,2}):?(\d{2})?\s*[~-]\s*(\d{1,2}):?(\d{2})?\s+(.+)$/);
    if (!match) {
      invalid.push(line);
      return;
    }

    const startHour = Number(match[1]);
    const startMinute = Number(match[2] || "00");
    const endHour = Number(match[3]);
    const endMinute = Number(match[4] || "00");
    const title = match[5].trim();
    const validTime = startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 24 && startMinute >= 0 && startMinute <= 59 && endMinute >= 0 && endMinute <= 59;

    if (!validTime || !title) {
      invalid.push(line);
      return;
    }

    entries.push({ startHour, startMinute, endHour, endMinute, title });
  });

  return { entries, invalid };
};

export default function DurationTimeline({ items = [], date, onSaveEntries }) {
  const [drafts, setDrafts] = useState({});
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [rangeTitle, setRangeTitle] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [quickError, setQuickError] = useState("");
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
      startMinute: 0,
      endHour: Number(hour) + 1,
      endMinute: 0,
      title: title.trim()
    }));

    if (rangeMin !== null && rangeMax !== null && rangeTitle.trim()) {
      entries.push({
        startHour: rangeMin,
        startMinute: 0,
        endHour: Math.min(24, rangeMax + 1),
        endMinute: 0,
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

  const saveQuickTimeline = () => {
    const { entries, invalid } = parseQuickTimeline(quickText);
    if (invalid.length) {
      setQuickError(`형식을 확인해주세요: ${invalid[0]}`);
      return;
    }
    if (!entries.length) {
      setQuickError("추가할 타임라인을 입력해주세요.");
      return;
    }
    onSaveEntries?.(entries);
    setQuickText("");
    setQuickError("");
    setQuickOpen(false);
  };

  return (
    <section className="glass relative rounded-[28px] bg-[#FFFDF5]/75 p-5">
      <SectionTitle
        action={
          <div className="flex flex-wrap gap-2">
            <AppButton variant="soft" onClick={() => setQuickOpen((value) => !value)}>빠른 타임라인 추가</AppButton>
            <AppButton variant="soft" onClick={saveDrafts}>타임블록 저장</AppButton>
          </div>
        }
      >
        오늘 일정 / 타임블록
      </SectionTitle>

      {quickOpen && (
        <div className="mb-4 rounded-[22px] bg-white/70 p-4">
          <p className="mb-2 text-sm font-black text-clover-ink">한 줄에 하나씩 입력해주세요</p>
          <textarea
            value={quickText}
            onChange={(event) => {
              setQuickText(event.target.value);
              setQuickError("");
            }}
            placeholder={"09:00~10:00 기상\n13:00~15:00 어쩌구"}
            className="min-h-28 w-full resize-y rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-sm font-bold text-clover-text outline-none transition placeholder:text-clover-sub/60 focus:border-clover-primary focus:ring-2 focus:ring-clover-primary/25"
          />
          {quickError && <p className="mt-2 text-xs font-black text-red-500">{quickError}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <AppButton variant="soft" onClick={() => { setQuickOpen(false); setQuickError(""); }}>닫기</AppButton>
            <AppButton onClick={saveQuickTimeline}>추가</AppButton>
          </div>
        </div>
      )}

      {rangeMin !== null && rangeMax !== null && (
        <div className="mb-4 rounded-[22px] bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-700">{padHour(rangeMin)} - {padHour(Math.min(24, rangeMax + 1))}</p>
          <div className="mt-2 flex gap-2">
            <AppInput value={rangeTitle} onChange={(event) => setRangeTitle(event.target.value)} placeholder="선택한 시간에 할 일을 적어주세요" />
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
              <div className="pt-2 text-right text-xs font-black text-clover-sub">{padHour(hour)}</div>
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
        시간 줄을 드래그하거나, 빠른 타임라인 추가에 여러 줄을 붙여넣으면 한 번에 저장돼요.
      </p>
    </section>
  );
}

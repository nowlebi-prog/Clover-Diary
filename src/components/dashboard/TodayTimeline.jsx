import StatusBadge from "../common/StatusBadge";

const formatTime = (value) => {
  if (!value) return "";
  const [hour = "", minute = "00"] = String(value).split(":");
  if (!hour) return "";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const hourOf = (item) => {
  if (item.allDay) return null;
  const match = String(item.time || item.startTime || item.dueTime || "").match(/^(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

const endHourOf = (item) => {
  const match = String(item.endTime || "").match(/^(\d{1,2})/);
  return match ? Number(match[1]) : null;
};

const timeLabel = (item) => {
  const start = formatTime(item.time || item.startTime || item.dueTime);
  const end = formatTime(item.endTime);
  if (start && end) return `${start}-${end}`;
  return start || "시간 미정";
};

const labelOf = (item) => {
  if (item.label && !/[�]/.test(item.label)) return item.label;
  if (item.type === "todo") return "할 일";
  if (item.type === "content") return "콘텐츠";
  if (item.type === "payment") return "결제";
  if (item.type === "expense") return "지출";
  if (item.type === "campaign") return "신청";
  return "일정";
};

const toneOf = (item) => {
  if (item.type === "payment" || item.type === "expense") return "danger";
  if (item.type === "todo") return "blue";
  if (item.type === "content") return "lavender";
  return "mint";
};

export default function TodayTimeline({ items = [] }) {
  const currentHour = new Date().getHours();
  const startHour = Math.min(19, Math.max(0, currentHour - 2));
  const visibleHours = Array.from({ length: 5 }, (_, index) => startHour + index);
  const hasTime = (item) => Boolean(formatTime(item.time || item.startTime || item.dueTime));
  const travelItems = items.filter((item) => item.travelNeeded);
  const allDayItems = items.filter((item) => !item.travelNeeded && (item.allDay || !hasTime(item)));
  const timedItems = items.filter((item) => !item.allDay && hasTime(item));

  return (
    <div className="grid gap-3">
      <div className="rounded-[18px] bg-emerald-50/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <b className="text-sm">종일 일정</b>
          <StatusBadge tone="mint">{allDayItems.length}</StatusBadge>
        </div>
        <div className="grid gap-1.5">
          {allDayItems.slice(0, 8).map((item, index) => (
            <div key={`${item.type}-${item.id || index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-bold">
              <span className="truncate">{item.displayTitle}</span>
              <StatusBadge tone={toneOf(item)}>{labelOf(item)}</StatusBadge>
            </div>
          ))}
          {!allDayItems.length && <p className="text-xs font-bold text-clover-sub">오늘 종일 일정은 없어요.</p>}
        </div>
      </div>

      {!!travelItems.length && (
        <div className="grid gap-1.5">
          {travelItems.map((item, index) => (
            <div key={`${item.type}-travel-${item.id || index}`} className="truncate rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              이동 필요 일정 {timeLabel(item)} {item.displayTitle}
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[22px] bg-white/35 p-2">
        <div className="grid gap-0">
          {visibleHours.map((hour) => {
            const hourItems = timedItems.filter((item) => {
              const start = hourOf(item);
              const end = endHourOf(item);
              if (start === null) return false;
              return end ? hour >= start && hour < end : hour === start;
            });
            return (
              <div key={hour} className={`grid min-h-12 grid-cols-[44px_minmax(0,1fr)] gap-2 border-b border-clover-line/70 ${hour === currentHour ? "rounded-2xl bg-clover-mint/25" : ""}`}>
                <div className="pt-3 text-right text-[11px] font-black text-clover-sub">{String(hour).padStart(2, "0")}:00</div>
                <div className="min-w-0 py-1.5">
                  <div className="grid gap-1.5 border-l border-clover-line pl-3">
                    {hourItems.map((item, index) => (
                      <article key={`${item.type}-${item.id || index}`} className="min-w-0 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-sm">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-clover-deep">{timeLabel(item)}</p>
                            <h3 className="truncate text-xs font-bold">{item.displayTitle}</h3>
                          </div>
                          <StatusBadge tone={toneOf(item)}>{labelOf(item)}</StatusBadge>
                        </div>
                      </article>
                    ))}
                    {!hourItems.length && <div className="h-5 rounded-2xl bg-white/25" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!timedItems.length && <p className="p-3 text-xs font-bold text-clover-sub">시간별 일정은 아직 비어 있어요.</p>}
      </div>
    </div>
  );
}

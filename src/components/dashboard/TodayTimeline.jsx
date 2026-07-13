import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";

const hours = Array.from({ length: 24 }, (_, index) => index);

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
  if (!item.endTime && item.spansToNextDay) return 24;
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
  if (item.label) return item.label;
  if (item.type === "todo") return "Todo";
  if (item.type === "content") return "Content";
  if (item.type === "payment") return "Payment";
  return "Event";
};

const toneOf = (item) => {
  if (item.type === "payment") return "danger";
  if (item.type === "todo") return "blue";
  if (item.type === "content") return "lavender";
  return "mint";
};

export default function TodayTimeline({ items = [], onToggleNeedMove, fullDay = false }) {
  const needMoveItems = items.filter((item) => item.needMove);
  const allDayItems = items.filter((item) => item.allDay && !item.needMove);
  const timedItems = items.filter((item) => !item.allDay && !item.needMove);
  const currentHour = new Date().getHours();
  const visibleHours = fullDay ? hours : hours.filter((hour) => hour >= currentHour - 2 && hour <= currentHour + 2);
  const hasTimed = timedItems.length > 0;

  return (
    <div className="grid gap-4">
      <div className="rounded-[22px] bg-emerald-50/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <b className="text-sm">종일 일정</b>
          <StatusBadge tone="mint">{allDayItems.length + needMoveItems.length}</StatusBadge>
        </div>
        <div className="grid gap-2">
          {allDayItems.map((item, index) => (
            <div key={`${item.type}-${item.id || index}`} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold">
              <span className="truncate">{item.displayTitle}</span>
              <StatusBadge tone={toneOf(item)}>{labelOf(item)}</StatusBadge>
            </div>
          ))}
          {needMoveItems.map((item, index) => (
            <div key={`move-${item.type}-${item.id || index}`} className="flex items-center justify-between rounded-2xl bg-red-100/60 px-4 py-3 text-sm font-bold">
              <span className="truncate">이동 필요 일정 {timeLabel(item)} {item.displayTitle}</span>
              <StatusBadge tone="danger">{labelOf(item)}</StatusBadge>
            </div>
          ))}
          {!allDayItems.length && !needMoveItems.length && <p className="text-sm font-bold text-clover-sub">오늘 종일 일정은 없어요.</p>}
        </div>
      </div>

      <div className="rounded-[24px] bg-white/35 p-3">
        <div className="grid gap-0">
          {visibleHours.map((hour) => {
            const hourItems = timedItems.filter((item) => {
              const start = hourOf(item);
              const end = endHourOf(item);
              if (start === null) return hour === 23 && !formatTime(item.time || item.startTime || item.dueTime);
              return end ? hour >= start && hour < end : hour === start;
            });
            return (
              <div key={hour} className={`grid min-h-16 grid-cols-[58px_1fr] gap-3 border-b border-clover-line/70 ${hour === currentHour ? "rounded-2xl bg-clover-mint/30" : ""}`}>
                <div className="pt-3 text-right text-xs font-black text-clover-sub">{String(hour).padStart(2, "0")}:00</div>
                <div className="relative py-2">
                  <span className="absolute left-0 top-0 h-full w-px bg-clover-line" />
                  <div className="ml-4 grid gap-2">
                    {hourItems.map((item, index) => {
                      const editable = item.type === "todo" && item.id;
                      const Wrapper = editable ? Link : "article";
                      const wrapperProps = editable ? { to: `/tasks?edit=${item.id}` } : {};
                      return (
                        <Wrapper key={`${item.type}-${item.id || index}`} {...wrapperProps} className="block rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm transition hover:bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-black text-clover-deep">{timeLabel(item)}</p>
                              <h3 className="truncate text-sm font-bold">{item.displayTitle}</h3>
                              {item.memo && <p className="mt-1 line-clamp-2 text-xs text-clover-sub">{item.memo}</p>}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {item.type === "todo" && onToggleNeedMove && (
                                <label className="flex items-center gap-1 text-[10px] font-black text-rose-500" onClick={(event) => event.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.needMove)}
                                    onChange={(event) => { event.stopPropagation(); onToggleNeedMove(item); }}
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                  이동 필요
                                </label>
                              )}
                              <StatusBadge tone={toneOf(item)}>{labelOf(item)}</StatusBadge>
                            </div>
                          </div>
                        </Wrapper>
                      );
                    })}
                    {!hourItems.length && <div className="h-8 rounded-2xl bg-white/25" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!hasTimed && <p className="p-4 text-sm font-bold text-clover-sub">시간별 일정은 아직 비어 있어요.</p>}
      </div>
    </div>
  );
}

import StatusBadge from "../common/StatusBadge";

const itemHour = (item) => {
  const match = String(item.time || "").match(/(\d{1,2}):/);
  return match ? Number(match[1]) : 24;
};

const labelOf = (item) => {
  if (item.label) return item.label;
  if (item.type === "todo") return "Todo";
  if (item.type === "content") return "Content";
  if (item.type === "payment") return "Payment";
  return "Event";
};

export default function TodayTimeline({ items = [] }) {
  const currentHour = new Date().getHours();
  const sorted = [...items].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
  const upcoming = sorted.filter((item) => itemHour(item) >= currentHour);
  const visible = upcoming.length ? upcoming : sorted;

  return (
    <div className="relative grid gap-3 pl-1">
      <span className="absolute left-[74px] top-2 h-[calc(100%-16px)] w-px bg-clover-line" />
      {visible.map((item, index) => {
        const isNow = item.time && itemHour(item) === currentHour;
        return (
          <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[64px_1fr] gap-4">
            <div className="shrink-0 whitespace-nowrap pt-2 text-right text-xs font-black leading-tight text-clover-sub">
              {item.time || "종일"}
            </div>
            <div className={`relative min-w-0 rounded-[18px] px-4 py-3 ${isNow ? "bg-white ring-2 ring-clover-primary/60" : "bg-white/55"}`}>
              <span className={`absolute -left-[23px] top-4 h-3 w-3 rounded-full ring-4 ring-[#F8FAF7] ${isNow ? "bg-clover-coralDeep" : "bg-clover-deep"}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-bold leading-snug">{item.displayTitle}</h3>
                  {item.memo && <p className="mt-1 line-clamp-2 break-words text-xs text-clover-sub">{item.memo}</p>}
                </div>
                <StatusBadge tone={item.type === "payment" || item.type === "todo" ? "danger" : item.type === "content" ? "blue" : "mint"}>{labelOf(item)}</StatusBadge>
              </div>
            </div>
          </article>
        );
      })}
      {!visible.length && <p className="rounded-[18px] bg-white/45 p-4 text-sm text-clover-sub">지금 이후 일정은 아직 비어 있어요.</p>}
    </div>
  );
}

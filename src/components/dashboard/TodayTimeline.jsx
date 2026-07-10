import StatusBadge from "../common/StatusBadge";

export default function TodayTimeline({ items }) {
  const sorted = [...items].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));

  return (
    <div className="relative grid gap-3 pl-2">
      <span className="absolute left-[67px] top-2 h-[calc(100%-16px)] w-px bg-clover-line" />
      {sorted.map((item, index) => (
        <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[54px_1fr] gap-5">
          <div className="pt-2 text-right text-xs font-black text-clover-sub">{item.time || "all"}</div>
          <div className="relative rounded-[18px] bg-white/55 px-4 py-3">
            <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-clover-deep ring-4 ring-[#F8FAF7]" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold">{item.displayTitle}</h3>
                {item.memo && <p className="mt-1 line-clamp-2 text-xs text-clover-sub">{item.memo}</p>}
              </div>
              <StatusBadge tone={item.type === "payment" || item.type === "todo" ? "danger" : item.type === "content" ? "blue" : "mint"}>{item.label}</StatusBadge>
            </div>
          </div>
        </article>
      ))}
      {!sorted.length && <p className="rounded-[18px] bg-white/45 p-4 text-sm text-clover-sub">오늘 일정은 비어 있어요.</p>}
    </div>
  );
}

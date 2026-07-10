import StatusBadge from "../common/StatusBadge";

export default function TodayTimeline({ items }) {
  const sorted = [...items].sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

  return (
    <div className="grid gap-3">
      {sorted.map((item, index) => (
        <article key={`${item.type}-${item.id || index}`} className="grid grid-cols-[58px_1fr] gap-3">
          <div className="pt-3 text-right text-xs font-bold text-clover-sub">{item.time || "하루"}</div>
          <div className="relative rounded-[22px] bg-white/55 p-4">
            <span className="absolute -left-[19px] top-5 h-3 w-3 rounded-full bg-clover-deep ring-4 ring-white/70" />
            <StatusBadge tone={item.type === "payment" || item.type === "todo" ? "danger" : item.type === "content" ? "blue" : "mint"}>{item.label}</StatusBadge>
            <h3 className="mt-3 font-bold">{item.displayTitle}</h3>
            {item.memo && <p className="mt-1 text-sm text-clover-sub">{item.memo}</p>}
          </div>
        </article>
      ))}
      {!sorted.length && <p className="rounded-[22px] bg-white/45 p-4 text-sm text-clover-sub">오늘 등록된 일정이 없어요.</p>}
    </div>
  );
}

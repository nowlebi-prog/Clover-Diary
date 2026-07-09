import StatusBadge from "../common/StatusBadge";

export default function TodayTimeline({ items }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 thin-scroll">
      {items.map((item, index) => (
        <article key={`${item.type}-${item.id || index}`} className="min-w-[210px] rounded-[22px] bg-white/55 p-4">
          <StatusBadge tone={item.type === "payment" || item.type === "todo" ? "danger" : item.type === "content" ? "blue" : "mint"}>{item.label}</StatusBadge>
          <h3 className="mt-3 font-bold">{item.displayTitle}</h3>
          <p className="mt-1 text-sm text-clover-sub">{item.time || item.date}</p>
        </article>
      ))}
      {!items.length && <p className="rounded-[22px] bg-white/45 p-4 text-sm text-clover-sub">No timeline items today.</p>}
    </div>
  );
}

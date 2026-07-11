import AppButton from "../common/AppButton";
import StatusBadge from "../common/StatusBadge";

export default function DayDetailPanel({ date, items, onAddEvent, onEditEvent, onDeleteEvent }) {
  return (
    <aside className="glass rounded-[28px] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-clover-deep">Selected day</p>
          <h2 className="text-xl font-bold">{date}</h2>
        </div>
        <AppButton onClick={onAddEvent}>+ Event</AppButton>
      </div>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <article key={`${item.type}-${item.id || index}`} className="rounded-[22px] bg-white/55 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <StatusBadge tone={item.type === "todo" || item.type === "payment" ? "danger" : item.type === "content" ? "blue" : "mint"}>{item.label || item.badge || item.type}</StatusBadge>
              {item.type === "event" && (
                <div className="flex gap-1">
                  <button className="text-xs font-bold text-clover-sub" onClick={() => onEditEvent(item)}>수정</button>
                  <button className="text-xs font-bold text-red-500" onClick={() => onDeleteEvent(item.id)}>삭제</button>
                </div>
              )}
            </div>
            <h3 className="font-bold">{item.displayTitle}</h3>
            {(item.time || item.memo) && <p className="mt-1 text-sm text-clover-sub">{item.time} {item.memo}</p>}
          </article>
        ))}
        {!items.length && <p className="rounded-[22px] bg-white/45 p-4 text-sm text-clover-sub">Nothing scheduled here yet.</p>}
      </div>
    </aside>
  );
}

import DeadlineList from "../../../components/dashboard/DeadlineList";
import IncompleteTodoList from "../../../components/dashboard/IncompleteTodoList";
import StatusBadge from "../../../components/common/StatusBadge";

export default function TodayFocusPanel({ incomplete = [], deadlines = [], delayed = [], today, onToggleTodo }) {
  const todayCount = incomplete.filter((todo) => !todo.dueDate || todo.dueDate <= today).length;

  return (
    <aside className="glass h-fit rounded-[28px] p-5 xl:sticky xl:top-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clover-deep">Focus list</p>
        <h2 className="mt-1 text-xl font-bold">아직 남은 일</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/50 p-3 text-center">
          <p className="text-lg font-black text-clover-deep">{todayCount}</p>
          <p className="text-[11px] font-bold text-clover-sub">오늘</p>
        </div>
        <div className="rounded-2xl bg-white/50 p-3 text-center">
          <p className="text-lg font-black text-amber-500">{deadlines.length}</p>
          <p className="text-[11px] font-bold text-clover-sub">마감</p>
        </div>
        <div className="rounded-2xl bg-white/50 p-3 text-center">
          <p className="text-lg font-black text-[#8b6fd6]">{delayed.length}</p>
          <p className="text-[11px] font-bold text-clover-sub">미룸</p>
        </div>
      </div>

      <div className="grid gap-5">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">오늘 처리</h3>
            <StatusBadge tone="blue">{incomplete.length}</StatusBadge>
          </div>
          <IncompleteTodoList todos={incomplete.slice(0, 5)} today={today} onToggle={onToggleTodo} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">가까운 마감</h3>
            <StatusBadge tone="warning">{deadlines.length}</StatusBadge>
          </div>
          <DeadlineList items={deadlines.slice(0, 4)} today={today} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">미뤄둔 일</h3>
            <StatusBadge tone={delayed.length ? "danger" : "mint"}>{delayed.length}</StatusBadge>
          </div>
          <div className="grid gap-1.5">
            {delayed.slice(0, 3).map((todo) => (
              <article key={todo.id} className="rounded-[18px] bg-white/45 px-3 py-2.5">
                <p className="truncate text-sm font-bold">{todo.title}</p>
                <p className="mt-1 truncate text-[11px] text-clover-sub">{todo.delayedReason || "나중에 처리하기로 한 일"}</p>
              </article>
            ))}
            {!delayed.length && <p className="rounded-[18px] bg-white/35 p-3 text-sm text-clover-sub">미룬 일은 없어요.</p>}
          </div>
        </section>
      </div>
    </aside>
  );
}

import DeadlineList from "../../../components/dashboard/DeadlineList";
import IncompleteTodoList from "../../../components/dashboard/IncompleteTodoList";
import GlassCard from "../../../components/common/GlassCard";
import SectionTitle from "../../../components/common/SectionTitle";
import StatusBadge from "../../../components/common/StatusBadge";

export default function TodayFocusPanel({ incomplete = [], deadlines = [], delayed = [], today, onToggleTodo }) {
  return (
    <GlassCard className="h-fit xl:sticky xl:top-5">
      <SectionTitle>안 끝난 할 일</SectionTitle>
      <div className="grid gap-5">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-clover-text">오늘</h2>
            <StatusBadge tone="blue">{incomplete.length}</StatusBadge>
          </div>
          <IncompleteTodoList todos={incomplete.slice(0, 4)} today={today} onToggle={onToggleTodo} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-clover-text">마감</h2>
            <StatusBadge tone="warning">{deadlines.length}</StatusBadge>
          </div>
          <DeadlineList items={deadlines.slice(0, 3)} today={today} />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-clover-text">미룸</h2>
            <StatusBadge tone={delayed.length ? "danger" : "mint"}>{delayed.length}</StatusBadge>
          </div>
          <div className="grid gap-2">
            {delayed.slice(0, 3).map((todo) => (
              <article key={todo.id} className="rounded-2xl bg-white/55 p-3">
                <p className="text-sm font-bold">{todo.title}</p>
                <p className="mt-1 text-xs text-clover-sub">{todo.delayedReason || "나중에 처리하기로 한 일"}</p>
              </article>
            ))}
            {!delayed.length && <p className="text-sm text-clover-sub">오늘은 미룬 일이 없어요.</p>}
          </div>
        </section>
      </div>
    </GlassCard>
  );
}

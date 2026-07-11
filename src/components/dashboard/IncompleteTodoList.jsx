import CustomCheckbox from "../common/CustomCheckbox";
import StatusBadge from "../common/StatusBadge";
import { daysBetween } from "../../lib/utils/date";

export default function IncompleteTodoList({ todos, today, onToggle }) {
  return (
    <div className="grid gap-1.5">
      {todos.slice(0, 6).map((todo) => {
        const dday = todo.dueDate ? daysBetween(today, todo.dueDate) : null;
        return (
          <article key={todo.id} className="rounded-[18px] bg-white/45 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <CustomCheckbox checked={todo.completed} onChange={(checked) => onToggle(todo.id, checked)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{todo.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {todo.category && <StatusBadge tone="blue">{todo.category}</StatusBadge>}
                  {todo.priority && <StatusBadge tone={todo.priority === "high" ? "danger" : "mint"}>{todo.priority}</StatusBadge>}
                  {todo.dueDate && <StatusBadge tone={dday <= 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      {!todos.length && <p className="rounded-[18px] bg-white/35 p-3 text-sm text-clover-sub">남은 일이 없어요.</p>}
    </div>
  );
}

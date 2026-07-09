import { Link } from "react-router-dom";
import AppButton from "../common/AppButton";
import CustomCheckbox from "../common/CustomCheckbox";
import StatusBadge from "../common/StatusBadge";
import { daysBetween } from "../../lib/utils/date";

export default function IncompleteTodoList({ todos, today, onToggle }) {
  return (
    <div className="grid gap-2">
      {todos.slice(0, 5).map((todo) => {
        const dday = todo.dueDate ? daysBetween(today, todo.dueDate) : null;
        return (
          <article key={todo.id} className="rounded-2xl bg-white/55 p-3">
            <div className="flex items-start gap-3">
              <CustomCheckbox checked={todo.completed} onChange={(checked) => onToggle(todo.id, checked)} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{todo.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {todo.category && <StatusBadge tone="blue">{todo.category}</StatusBadge>}
                  {todo.priority && <StatusBadge tone={todo.priority === "high" ? "danger" : "mint"}>{todo.priority}</StatusBadge>}
                  {todo.dueDate && <StatusBadge tone={dday <= 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      {!todos.length && <p className="text-sm text-clover-sub">No open todos.</p>}
      <Link to="/tasks"><AppButton variant="soft" className="mt-2 w-full">Go to Tasks</AppButton></Link>
    </div>
  );
}

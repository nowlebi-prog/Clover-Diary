import AppButton from "../common/AppButton";
import CustomCheckbox from "../common/CustomCheckbox";
import StatusBadge from "../common/StatusBadge";
import { daysBetween } from "../../lib/utils/date";

export default function TaskSection({ title, items, today, onToggle, onEdit, onDelay }) {
  return (
    <section className="glass rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <StatusBadge tone="mint">{items.length}</StatusBadge>
      </div>
      <div className="grid gap-3">
        {items.map((todo) => {
          const dday = todo.dueDate ? daysBetween(today, todo.dueDate) : null;
          return (
            <article key={todo.id} className={`rounded-[22px] bg-white/55 p-4 ${todo.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <CustomCheckbox checked={todo.completed} onChange={(checked) => onToggle(todo.id, checked)} />
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold ${todo.completed ? "line-through" : ""}`}>{todo.title}</h3>
                  {todo.memo && <p className="mt-1 line-clamp-2 text-sm text-clover-sub">{todo.memo}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {todo.category && <StatusBadge tone="blue">{todo.category}</StatusBadge>}
                    {todo.priority && <StatusBadge tone={todo.priority === "high" ? "danger" : todo.priority === "low" ? "cream" : "mint"}>{todo.priority}</StatusBadge>}
                    {todo.dueDate && <StatusBadge tone={dday < 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                    {todo.project && <StatusBadge tone="lavender">{todo.project}</StatusBadge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AppButton variant="ghost" onClick={() => onEdit(todo)}>Edit</AppButton>
                    {!todo.completed && <AppButton variant="ghost" onClick={() => onDelay(todo)}>Delay</AppButton>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!items.length && <p className="rounded-[22px] bg-white/40 p-4 text-sm text-clover-sub">Nothing here.</p>}
      </div>
    </section>
  );
}

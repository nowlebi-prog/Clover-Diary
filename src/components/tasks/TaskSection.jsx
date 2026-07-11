import AppButton from "../common/AppButton";
import CustomCheckbox from "../common/CustomCheckbox";
import StatusBadge from "../common/StatusBadge";
import { daysBetween } from "../../lib/utils/date";

const priorityStyle = {
  high: "bg-red-400 ring-red-100",
  normal: "bg-amber-300 ring-amber-100",
  low: "bg-emerald-300 ring-emerald-100"
};

const priorityLabel = {
  high: "매우 중요",
  normal: "보통",
  low: "가벼움"
};

const formatTime = (value) => {
  if (!value) return "";
  const [hour = "", minute = "00"] = String(value).split(":");
  if (!hour) return "";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const timeLabel = (todo) => {
  if (todo.allDay) return "하루종일";
  const start = formatTime(todo.startTime || todo.dueTime);
  const end = formatTime(todo.endTime);
  if (start && end) return `${start}-${end}`;
  return start;
};

export default function TaskSection({ title, items, today, onToggle, onToggleSubTask, onEdit, onDelay }) {
  return (
    <section className="glass rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <StatusBadge tone="mint">{items.length}</StatusBadge>
      </div>
      <div className="grid gap-3">
        {items.map((todo) => {
          const dday = todo.dueDate ? daysBetween(today, todo.dueDate) : null;
          const time = timeLabel(todo);
          return (
            <article key={todo.id} className={`rounded-[22px] bg-white/55 p-4 ${todo.completed ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-2 h-3 w-3 shrink-0 rounded-full ring-4 ${priorityStyle[todo.priority] || priorityStyle.normal}`} title={priorityLabel[todo.priority] || "보통"} />
                <CustomCheckbox checked={todo.completed} onChange={(checked) => onToggle(todo.id, checked)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-bold ${todo.completed ? "line-through" : ""}`}>{todo.title}</h3>
                    {time && <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-black text-clover-deep">{time}</span>}
                  </div>
                  {!!todo.subTasks?.length && (
                    <div className="mt-3 grid gap-1 rounded-2xl bg-white/45 p-3">
                      {todo.subTasks.map((subTask) => (
                        <CustomCheckbox
                          key={subTask.id}
                          checked={subTask.completed}
                          label={subTask.title}
                          onChange={(checked) => onToggleSubTask?.(todo.id, subTask.id, checked)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {todo.category && <StatusBadge tone="blue">{todo.category}</StatusBadge>}
                    {todo.priority && <StatusBadge tone={todo.priority === "high" ? "danger" : todo.priority === "low" ? "cream" : "mint"}>{priorityLabel[todo.priority] || todo.priority}</StatusBadge>}
                    {todo.dueDate && <StatusBadge tone={dday < 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                  </div>
                  {todo.memo && <p className="mt-3 line-clamp-2 text-sm text-clover-sub">{todo.memo}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AppButton variant="ghost" onClick={() => onEdit(todo)}>수정</AppButton>
                    {!todo.completed && <AppButton variant="ghost" onClick={() => onDelay(todo)}>미루기</AppButton>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!items.length && <p className="rounded-[22px] bg-white/40 p-4 text-sm text-clover-sub">아직 비어 있어요.</p>}
      </div>
    </section>
  );
}

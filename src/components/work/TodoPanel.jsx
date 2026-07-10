import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import CustomCheckbox from "../common/CustomCheckbox";
import GlassCard from "../common/GlassCard";
import {
  createTodo,
  updateTodo,
  deleteTodo,
  setTodoPriority,
  reorderPriorityTodos
} from "../../lib/storage/localStorageAdapter";
import { toDateKey, addDays } from "../../lib/utils/date";

export default function TodoPanel({ todos = [], today }) {
  const [newTitle, setNewTitle] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [dragId, setDragId] = useState(null);

  const priorityTodos = useMemo(
    () => todos.filter((t) => t.isPriority && !t.completed).sort((a, b) => (a.priorityOrder ?? 0) - (b.priorityOrder ?? 0)),
    [todos]
  );
  const otherOpen = useMemo(() => todos.filter((t) => !t.isPriority && !t.completed), [todos]);
  const overdue = useMemo(() => otherOpen.filter((t) => t.dueDate && t.dueDate < today), [otherOpen, today]);
  const doneTodos = useMemo(() => todos.filter((t) => t.completed), [todos]);

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const ids = priorityTodos.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorderPriorityTodos(ids);
    setDragId(null);
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-clover-deep">Priority Todo</p>
          <h2 className="text-base font-black">우선 업무</h2>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <AppInput
          placeholder="새 업무 추가"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && newTitle.trim()) {
              createTodo({ title: newTitle.trim(), completed: false, priority: "normal", category: "업무", dueDate: today, isPriority: false });
              setNewTitle("");
            }
          }}
        />
        <AppButton
          className="min-h-11 px-4"
          onClick={() => {
            if (!newTitle.trim()) return;
            createTodo({ title: newTitle.trim(), completed: false, priority: "normal", category: "업무", dueDate: today, isPriority: false });
            setNewTitle("");
          }}
        >
          추가
        </AppButton>
      </div>

      <p className="mb-2 text-xs font-bold text-clover-sub">드래그로 순서를 바꿀 수 있어요. 최대 3개는 Home에도 보여요.</p>
      <div className="mb-4 grid gap-2">
        {priorityTodos.map((todo) => (
          <article
            key={todo.id}
            draggable
            onDragStart={() => setDragId(todo.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(todo.id)}
            className="flex cursor-grab items-center gap-3 rounded-2xl border border-clover-coral bg-clover-coral/40 px-3 py-2.5 active:cursor-grabbing"
          >
            <span className="text-clover-sub">⠿</span>
            <div className="min-w-0 flex-1">
              <CustomCheckbox
                checked={todo.completed}
                label={todo.title}
                onChange={(checked) => updateTodo(todo.id, { completed: checked, completedAt: checked ? today : "" })}
              />
            </div>
            <button className="shrink-0 text-xs font-bold text-clover-sub hover:text-clover-deep" onClick={() => setTodoPriority(todo.id, false)}>
              해제
            </button>
          </article>
        ))}
        {!priorityTodos.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">아래 목록에서 우선 업무를 골라보세요.</p>}
      </div>

      <p className="mb-2 text-xs font-black text-clover-sub">전체 업무 ({otherOpen.length})</p>
      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
        {otherOpen.map((todo) => {
          const isOverdue = todo.dueDate && todo.dueDate < today;
          return (
            <article key={todo.id} className="flex items-center gap-3 rounded-2xl bg-white/55 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <CustomCheckbox
                  checked={todo.completed}
                  label={todo.title}
                  onChange={(checked) => updateTodo(todo.id, { completed: checked, completedAt: checked ? today : "" })}
                />
                {todo.dueDate && (
                  <p className={`mt-0.5 pl-9 text-[11px] font-bold ${isOverdue ? "text-clover-danger" : "text-clover-sub"}`}>
                    ~{todo.dueDate} {isOverdue ? "· 지남" : ""}
                  </p>
                )}
              </div>
              {isOverdue && (
                <button
                  className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700"
                  onClick={() => updateTodo(todo.id, { dueDate: addDays(today, 1), delayedCount: (todo.delayedCount || 0) + 1 })}
                >
                  내일로 이월
                </button>
              )}
              <button
                className="shrink-0 rounded-full bg-clover-mint px-2.5 py-1 text-[11px] font-bold text-clover-deep"
                onClick={() => setTodoPriority(todo.id, true)}
              >
                ★ 우선
              </button>
              <button className="shrink-0 text-clover-sub hover:text-clover-danger" onClick={() => deleteTodo(todo.id)}>✕</button>
            </article>
          );
        })}
        {!otherOpen.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">남은 업무가 없어요.</p>}
      </div>

      {overdue.length > 0 && (
        <p className="mt-2 text-[11px] font-bold text-clover-danger">지난 마감 {overdue.length}건 — 이월 버튼으로 정리해보세요.</p>
      )}

      <button className="mt-4 text-xs font-bold text-clover-sub underline" onClick={() => setShowDone((v) => !v)}>
        완료된 업무 {doneTodos.length}개 {showDone ? "접기" : "펼치기"}
      </button>
      {showDone && (
        <div className="mt-2 grid gap-1.5">
          {doneTodos.map((todo) => (
            <div key={todo.id} className="flex items-center justify-between rounded-xl bg-white/40 px-3 py-2 text-xs text-clover-sub line-through">
              {todo.title}
              <button className="no-underline" onClick={() => updateTodo(todo.id, { completed: false })}>되돌리기</button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

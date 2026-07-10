import { useMemo, useState } from "react";
import AppButton from "../../../components/common/AppButton";
import AppInput from "../../../components/common/AppInput";
import StatusBadge from "../../../components/common/StatusBadge";
import { daysBetween } from "../../../lib/utils/date";

const groupsMeta = {
  must: { label: "꼭 해야 할 일", tone: "bg-red-50/90 border-red-100", badge: "danger" },
  deadlines: { label: "가까운 마감", tone: "bg-orange-50/90 border-orange-100", badge: "warning" },
  delayed: { label: "미뤄둔 일", tone: "bg-slate-100/80 border-slate-200", badge: "mint" }
};

export default function TodayFocusPanel({ incomplete = [], deadlines = [], delayed = [], today, onToggleTodo, onUpdateTodo }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  const must = useMemo(
    () => incomplete.filter((todo) => todo.priority === "high" || !todo.dueDate || todo.dueDate <= today || daysBetween(today, todo.dueDate) <= 3),
    [incomplete, today]
  );
  const sections = [
    ["must", must],
    ["deadlines", deadlines],
    ["delayed", delayed]
  ];

  const startEdit = (todo) => {
    if (!todo.id || todo.type && todo.type !== "todo") return;
    setEditingId(todo.id);
    setDraft({ title: todo.title || todo.displayTitle, dueDate: todo.dueDate || todo.date || "" });
  };

  const saveEdit = (todo) => {
    onUpdateTodo?.(todo.id, draft);
    setEditingId(null);
    setDraft({});
  };

  return (
    <aside className="glass h-fit rounded-[28px] p-5 xl:sticky xl:top-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Today Check</p>
        <h2 className="mt-1 text-xl font-black">오늘 체크</h2>
      </div>

      <div className="grid gap-3">
        {sections.map(([key, items]) => {
          const meta = groupsMeta[key];
          return (
            <section key={key} className={`rounded-[24px] border p-3 ${meta.tone}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black">{meta.label}</h3>
                <StatusBadge tone={meta.badge}>{items.length}</StatusBadge>
              </div>
              <div className="grid gap-2">
                {items.slice(0, key === "must" ? 5 : 4).map((item, index) => {
                  const todo = item.type ? item : { ...item, displayTitle: item.title, type: "todo" };
                  const dday = todo.dueDate || todo.date ? daysBetween(today, todo.dueDate || todo.date) : null;
                  const editing = editingId === todo.id;
                  return (
                    <article key={`${key}-${todo.id || index}`} className="rounded-[18px] bg-white/75 px-3 py-2.5">
                      {editing ? (
                        <div className="grid gap-2">
                          <AppInput value={draft.title || ""} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
                          <AppInput type="date" value={draft.dueDate || ""} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} />
                          <div className="flex gap-2">
                            <AppButton className="min-h-9 px-3 py-1 text-xs" onClick={() => saveEdit(todo)}>저장</AppButton>
                            <AppButton className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setEditingId(null)}>취소</AppButton>
                          </div>
                        </div>
                      ) : (
                        <button className="w-full text-left" onClick={() => startEdit(todo)}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-sm font-bold">{todo.displayTitle || todo.title}</p>
                            {dday !== null && <StatusBadge tone={dday <= 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                          </div>
                          <p className="mt-1 text-[11px] text-clover-sub">{todo.category || todo.label || todo.type || "Todo"} · {todo.priority || "normal"}</p>
                        </button>
                      )}
                    </article>
                  );
                })}
                {!items.length && <p className="rounded-[18px] bg-white/45 p-3 text-sm text-clover-sub">여기는 아직 비어 있어요.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

import { useMemo, useState } from "react";
import AppButton from "../../../components/common/AppButton";
import AppInput from "../../../components/common/AppInput";
import StatusBadge from "../../../components/common/StatusBadge";
import { daysBetween } from "../../../lib/utils/date";

const rowTone = {
  must: "bg-red-50/80",
  want: "bg-blue-50/80",
  later: "bg-white/55"
};

export default function TodayFocusPanel({ incomplete = [], deadlines = [], delayed = [], today, onToggleTodo, onUpdateTodo }) {
  const [tab, setTab] = useState("must");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  const groups = useMemo(() => {
    const must = incomplete.filter((todo) => todo.priority === "high" || !todo.dueDate || todo.dueDate <= today || daysBetween(today, todo.dueDate) <= 3);
    const later = incomplete.filter((todo) => todo.dueDate && daysBetween(today, todo.dueDate) >= 7);
    const want = incomplete.filter((todo) => !must.includes(todo) && !later.includes(todo));
    return { must, want, later };
  }, [incomplete, today]);

  const tabs = [
    ["must", "꼭 해야 할 일", groups.must.length],
    ["want", "하고 싶은 일", groups.want.length],
    ["later", "일주일 이상 남은 일", groups.later.length]
  ];
  const selected = groups[tab] || [];

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setDraft({ title: todo.title, dueDate: todo.dueDate || "" });
  };
  const saveEdit = (todo) => {
    onUpdateTodo?.(todo.id, draft);
    setEditingId(null);
    setDraft({});
  };

  return (
    <aside className="glass h-fit rounded-[28px] p-5 xl:sticky xl:top-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clover-deep">Today summary</p>
        <h2 className="mt-1 text-xl font-bold">오늘 요약</h2>
      </div>

      <div className="mb-4 grid gap-2">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold ${
              tab === key ? "bg-clover-mint text-clover-deep" : "bg-white/48 text-clover-text"
            }`}
          >
            <span>{label}</span>
            <span>{count}</span>
          </button>
        ))}
      </div>

      <section className={`rounded-[22px] p-3 ${rowTone[tab]}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">{tabs.find(([key]) => key === tab)?.[1]}</h3>
          <StatusBadge tone={tab === "must" ? "danger" : tab === "want" ? "blue" : "cream"}>{selected.length}</StatusBadge>
        </div>
        <div className="grid gap-2">
          {selected.slice(0, 8).map((todo) => {
            const dday = todo.dueDate ? daysBetween(today, todo.dueDate) : null;
            const editing = editingId === todo.id;
            return (
              <article key={todo.id} className="rounded-[18px] bg-white/70 px-3 py-2.5">
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
                      <p className="truncate text-sm font-bold">{todo.title}</p>
                      {todo.dueDate && <StatusBadge tone={dday <= 0 ? "danger" : dday <= 3 ? "warning" : "cream"}>{dday === 0 ? "Today" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}</StatusBadge>}
                    </div>
                    <p className="mt-1 text-[11px] text-clover-sub">{todo.category || "Todo"} · {todo.priority || "normal"}</p>
                  </button>
                )}
              </article>
            );
          })}
          {!selected.length && <p className="rounded-[18px] bg-white/45 p-3 text-sm text-clover-sub">여기는 아직 비어 있어요.</p>}
        </div>
      </section>

      <div className="mt-5 grid gap-4">
        <section className="rounded-[22px] bg-slate-100/55 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">가까운 마감</h3>
            <StatusBadge tone="warning">{deadlines.length}</StatusBadge>
          </div>
          {deadlines.slice(0, 3).map((item) => <p key={`${item.type}-${item.id}`} className="truncate py-1 text-xs font-bold">{item.displayTitle}</p>)}
        </section>
        <section className="rounded-[22px] bg-slate-100/55 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">미뤄둔 일</h3>
            <StatusBadge tone={delayed.length ? "danger" : "mint"}>{delayed.length}</StatusBadge>
          </div>
          {delayed.slice(0, 3).map((todo) => <p key={todo.id} className="truncate py-1 text-xs font-bold">{todo.title}</p>)}
          {!delayed.length && <p className="text-xs text-clover-sub">미룬 일은 없어요.</p>}
        </section>
      </div>
    </aside>
  );
}

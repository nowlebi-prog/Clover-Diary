import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import Modal from "../../components/common/Modal";
import TaskBoard from "../../components/tasks/TaskBoard";
import PageHeader from "../../components/layout/PageHeader";
import {
  createDelayedTask,
  createTodo,
  deleteTodo,
  getAllData,
  updateTodo
} from "../../lib/storage/localStorageAdapter";
import { daysBetween, toDateKey } from "../../lib/utils/date";

const emptyTodo = { title: "", memo: "", completed: false, priority: "normal", category: "개인", project: "", assignee: "", dueDate: toDateKey(new Date()), dueTime: "", delayedCount: 0, delayedReason: "" };

export default function TasksPage() {
  const [data, setData] = useState(getAllData());
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("board");
  const today = toDateKey(new Date());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", () => setEditing(emptyTodo));
    window.addEventListener("clover-open-quick-add", (event) => {
      if (event.detail === "todo") setEditing(emptyTodo);
    });
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.todos || []).filter((todo) => {
      const matchesQuery = !q || JSON.stringify(todo).toLowerCase().includes(q);
      const matchesCategory = category === "all" || todo.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [data.todos, query, category]);

  const openTodos = filtered.filter((todo) => !todo.completed);
  const todayItems = openTodos.filter((todo) => !todo.dueDate || todo.dueDate <= today);
  const upcoming = openTodos.filter((todo) => !todo.dueDate || todo.dueDate > today);
  const urgent = openTodos.filter((todo) => todo.dueDate && daysBetween(today, todo.dueDate) <= 3);
  const delayed = openTodos.filter((todo) => Number(todo.delayedCount || 0) > 0);
  const completed = filtered.filter((todo) => todo.completed);
  const sections = [
    { key: "today", title: "Today", items: todayItems },
    { key: "open", title: "Incomplete", items: upcoming },
    { key: "urgent", title: "Due soon", items: urgent },
    { key: "delayed", title: "Delayed", items: delayed },
    { key: "done", title: "Completed", items: completed }
  ];

  const save = () => {
    if (!editing.title?.trim()) return;
    if (editing.id) updateTodo(editing.id, editing);
    else createTodo(editing);
    setEditing(null);
    load();
  };
  const toggle = (id, completed) => updateTodo(id, { completed, completedAt: completed ? today : "" });
  const delay = (todo) => {
    const reason = prompt("Why are you delaying this?", todo.delayedReason || "");
    const count = Number(todo.delayedCount || 0) + 1;
    updateTodo(todo.id, { delayedCount: count, delayedReason: reason || todo.delayedReason || "Later" });
    createDelayedTask({ title: todo.title, count, reason: reason || "Later" });
  };

  return (
    <>
      <PageHeader eyebrow="Tasks" title="Task board">
        <AppButton onClick={() => setEditing(emptyTodo)}>+ Todo</AppButton>
      </PageHeader>
      <div className="mb-4 grid gap-3 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:grid-cols-[1fr_160px_160px]">
        <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" />
        <AppSelect value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {["개인", "업무", "집안일", "돈", "콘텐츠", "체험단", "기타"].map((item) => <option key={item}>{item}</option>)}
        </AppSelect>
        <AppSelect value={view} onChange={(event) => setView(event.target.value)}>
          <option value="board">Board</option>
          <option value="today">Today only</option>
          <option value="done">Completed</option>
        </AppSelect>
      </div>
      <TaskBoard
        sections={view === "today" ? [sections[0]] : view === "done" ? [sections[4]] : sections}
        today={today}
        onToggle={toggle}
        onEdit={setEditing}
        onDelay={delay}
      />

      <Modal title={editing ? (editing.id ? "Edit todo" : "Add todo") : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">Title<AppInput value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={editing.memo || ""} onChange={(event) => setEditing({ ...editing, memo: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">Due date<AppInput type="date" value={editing.dueDate || ""} onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">Due time<AppInput type="time" value={editing.dueTime || ""} onChange={(event) => setEditing({ ...editing, dueTime: event.target.value })} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">Priority<AppSelect value={editing.priority || "normal"} onChange={(event) => setEditing({ ...editing, priority: event.target.value })}><option value="high">high</option><option value="normal">normal</option><option value="low">low</option></AppSelect></label>
              <label className="grid gap-1 text-sm font-bold">Category<AppSelect value={editing.category || "개인"} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{["개인", "업무", "집안일", "돈", "콘텐츠", "체험단", "기타"].map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">Project<AppInput value={editing.project || editing.projectName || ""} onChange={(event) => setEditing({ ...editing, project: event.target.value, projectName: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">Person<AppInput value={editing.assignee || editing.person || ""} onChange={(event) => setEditing({ ...editing, assignee: event.target.value, person: event.target.value })} /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton onClick={save}>Save</AppButton>
              {editing.id && <AppButton variant="danger" onClick={() => { deleteTodo(editing.id); setEditing(null); }}>Delete</AppButton>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

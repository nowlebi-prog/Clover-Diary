import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import Modal from "../../components/common/Modal";
import TaskBoard from "../../components/tasks/TaskBoard";
import PageHeader from "../../components/layout/PageHeader";
import { createDelayedTask, createTodo, deleteTodo, getAllData, updateTodo } from "../../lib/storage/localStorageAdapter";
import { daysBetween, toDateKey } from "../../lib/utils/date";

const emptyTodo = { title: "", memo: "", completed: false, priority: "normal", category: "개인", project: "", assignee: "", dueDate: toDateKey(new Date()), dueTime: "", delayedCount: 0, delayedReason: "", subTasks: [] };
const subTaskText = (todo) => (todo.subTasks || []).map((item) => item.title).join("\n");
const parseSubTasks = (text, existing = []) => text.split("\n").map((line) => line.trim()).filter(Boolean).map((title, index) => ({
  id: existing[index]?.id || `sub-${Date.now()}-${index}`,
  title,
  completed: Boolean(existing[index]?.completed)
}));

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
    { key: "today", title: "오늘", items: todayItems },
    { key: "open", title: "예정", items: upcoming },
    { key: "urgent", title: "마감 임박", items: urgent },
    { key: "delayed", title: "미룬 일", items: delayed },
    { key: "done", title: "완료", items: completed }
  ];

  const save = () => {
    if (!editing.title?.trim()) return;
    const payload = { ...editing, subTasks: editing.subTasks || [] };
    if (editing.id) updateTodo(editing.id, payload);
    else createTodo(payload);
    setEditing(null);
    load();
  };
  const toggle = (id, completed) => updateTodo(id, { completed, completedAt: completed ? today : "" });
  const toggleSubTask = (todoId, subTaskId, completed) => {
    const todo = data.todos.find((item) => item.id === todoId);
    if (!todo) return;
    updateTodo(todoId, { subTasks: (todo.subTasks || []).map((item) => item.id === subTaskId ? { ...item, completed } : item) });
  };
  const delay = (todo) => {
    const reason = prompt("미루는 이유를 적어둘까요?", todo.delayedReason || "");
    const count = Number(todo.delayedCount || 0) + 1;
    updateTodo(todo.id, { delayedCount: count, delayedReason: reason || todo.delayedReason || "Later" });
    createDelayedTask({ title: todo.title, count, reason: reason || "Later" });
  };

  return (
    <>
      <PageHeader eyebrow="Tasks" title="To do list">
        <AppButton onClick={() => setEditing(emptyTodo)}>+ 할 일</AppButton>
      </PageHeader>
      <div className="mb-4 grid gap-3 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:grid-cols-[1fr_160px_160px]">
        <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="할 일 검색" />
        <AppSelect value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">전체</option>
          {["개인", "업무", "집안일", "뷰티", "콘텐츠", "체험단", "기타"].map((item) => <option key={item}>{item}</option>)}
        </AppSelect>
        <AppSelect value={view} onChange={(event) => setView(event.target.value)}>
          <option value="board">보드</option>
          <option value="today">오늘만</option>
          <option value="done">완료</option>
        </AppSelect>
      </div>
      <TaskBoard
        sections={view === "today" ? [sections[0]] : view === "done" ? [sections[4]] : sections}
        today={today}
        onToggle={toggle}
        onToggleSubTask={toggleSubTask}
        onEdit={setEditing}
        onDelay={delay}
      />

      <Modal title={editing ? (editing.id ? "할 일 수정" : "할 일 추가") : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-bold">제목<AppInput value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={editing.memo || ""} onChange={(event) => setEditing({ ...editing, memo: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">하위 목록
              <AppTextarea
                value={subTaskText(editing)}
                onChange={(event) => setEditing({ ...editing, subTasks: parseSubTasks(event.target.value, editing.subTasks || []) })}
                placeholder={"한 줄에 하나씩 입력하면 체크 가능한 하위 목록이 됩니다."}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">마감일<AppInput type="date" value={editing.dueDate || ""} onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">시간<AppInput type="time" value={editing.dueTime || ""} onChange={(event) => setEditing({ ...editing, dueTime: event.target.value })} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">중요도<AppSelect value={editing.priority || "normal"} onChange={(event) => setEditing({ ...editing, priority: event.target.value })}><option value="high">high</option><option value="normal">normal</option><option value="low">low</option></AppSelect></label>
              <label className="grid gap-1 text-sm font-bold">분류<AppSelect value={editing.category || "개인"} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>{["개인", "업무", "집안일", "뷰티", "콘텐츠", "체험단", "기타"].map((item) => <option key={item}>{item}</option>)}</AppSelect></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">프로젝트<AppInput value={editing.project || editing.projectName || ""} onChange={(event) => setEditing({ ...editing, project: event.target.value, projectName: event.target.value })} /></label>
              <label className="grid gap-1 text-sm font-bold">사람/클라이언트<AppInput value={editing.assignee || editing.person || ""} onChange={(event) => setEditing({ ...editing, assignee: event.target.value, person: event.target.value })} /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton onClick={save}>저장</AppButton>
              {editing.id && <AppButton variant="danger" onClick={() => { deleteTodo(editing.id); setEditing(null); }}>삭제</AppButton>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import Modal from "../../components/common/Modal";
import TaskBoard from "../../components/tasks/TaskBoard";
import SubTaskEditor, { cleanSubTasks } from "../../components/tasks/SubTaskEditor";
import PageHeader from "../../components/layout/PageHeader";
import { createDelayedTask, createTodo, deleteTodo, getAllData, updateTodo } from "../../lib/storage/localStorageAdapter";
import { daysBetween, toDateKey } from "../../lib/utils/date";

const baseCategories = ["개인", "업무", "집안일", "콘텐츠", "건강", "돈관리", "정리", "기타"];

const emptyTodo = () => ({
  title: "",
  subTasks: [],
  dueDate: toDateKey(new Date()),
  allDay: false,
  startTime: "",
  endTime: "",
  dueTime: "",
  priority: "normal",
  category: "개인",
  project: "개인",
  projectName: "개인",
  memo: "",
  completed: false,
  delayedCount: 0,
  delayedReason: ""
});

const normalizeTodo = (todo) => {
  const category = (todo.category || "개인").trim();
  return {
    ...todo,
    subTasks: cleanSubTasks(todo.subTasks),
    category,
    project: category,
    projectName: category,
    dueTime: todo.allDay ? "" : todo.startTime || todo.dueTime || "",
    startTime: todo.allDay ? "" : todo.startTime || todo.dueTime || "",
    endTime: todo.allDay ? "" : todo.endTime || ""
  };
};

export default function TasksPage() {
  const [data, setData] = useState(getAllData());
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("board");
  const navigate = useNavigate();
  const today = toDateKey(new Date());

  const load = () => setData(getAllData());

  useEffect(() => {
    const openTodo = () => setEditing(emptyTodo());
    const openQuick = (event) => {
      if (event.detail === "todo") setEditing(emptyTodo());
    };
    window.addEventListener("clover-data-change", load);
    window.addEventListener("clover-quick-add", openTodo);
    window.addEventListener("clover-open-quick-add", openQuick);
    return () => {
      window.removeEventListener("clover-data-change", load);
      window.removeEventListener("clover-quick-add", openTodo);
      window.removeEventListener("clover-open-quick-add", openQuick);
    };
  }, []);

  const categories = useMemo(() => {
    const fromTodos = (data.todos || []).map((todo) => todo.category || todo.project).filter(Boolean);
    return [...new Set([...baseCategories, ...fromTodos])];
  }, [data.todos]);

  const categoryStats = useMemo(() => {
    return categories
      .map((name) => ({
        name,
        count: (data.todos || []).filter((todo) => !todo.completed && (todo.category || todo.project) === name).length
      }))
      .filter((item) => item.count > 0 || baseCategories.includes(item.name));
  }, [categories, data.todos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data.todos || []).filter((todo) => {
      const matchesQuery = !q || JSON.stringify(todo).toLowerCase().includes(q);
      const matchesCategory = category === "all" || (todo.category || todo.project) === category;
      return matchesQuery && matchesCategory;
    });
  }, [data.todos, query, category]);

  const openTodos = filtered.filter((todo) => !todo.completed);
  const todayItems = openTodos.filter((todo) => !todo.dueDate || todo.dueDate <= today);
  const upcoming = openTodos.filter((todo) => todo.dueDate && todo.dueDate > today);
  const urgent = openTodos.filter((todo) => todo.dueDate && daysBetween(today, todo.dueDate) <= 3);
  const delayed = openTodos.filter((todo) => Number(todo.delayedCount || 0) > 0);
  const completed = filtered.filter((todo) => todo.completed);
  const sections = [
    { key: "today", title: "오늘 처리", items: todayItems },
    { key: "urgent", title: "가까운 마감", items: urgent },
    { key: "delayed", title: "미뤄둔 일", items: delayed },
    { key: "open", title: "예정된 일", items: upcoming },
    { key: "done", title: "완료", items: completed }
  ];

  const save = () => {
    if (!editing?.title?.trim()) return;
    const payload = normalizeTodo({ ...editing, title: editing.title.trim() });
    if (editing.id) updateTodo(editing.id, payload);
    else createTodo(payload);
    setEditing(null);
    load();
  };

  const toggle = (id, completed) => {
    updateTodo(id, { completed, completedAt: completed ? today : "" });
    load();
  };

  const toggleSubTask = (todoId, subTaskId, completed) => {
    const todo = data.todos.find((item) => item.id === todoId);
    if (!todo) return;
    updateTodo(todoId, { subTasks: (todo.subTasks || []).map((item) => (item.id === subTaskId ? { ...item, completed } : item)) });
    load();
  };

  const delay = (todo) => {
    const reason = prompt("왜 미뤄졌는지 짧게 적어둘까요?", todo.delayedReason || "");
    const count = Number(todo.delayedCount || 0) + 1;
    updateTodo(todo.id, { delayedCount: count, delayedReason: reason || todo.delayedReason || "나중에 처리" });
    createDelayedTask({ title: todo.title, count, reason: reason || "나중에 처리" });
    load();
  };

  return (
    <>
      <PageHeader eyebrow="Work" title="할 일 관리">
        <AppButton onClick={() => setEditing(emptyTodo())}>+ 할 일 추가</AppButton>
      </PageHeader>

      <div className="mb-4 grid gap-3 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:grid-cols-[1fr_170px_150px]">
        <AppInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="할 일 검색" />
        <AppSelect value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">전체 분류</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </AppSelect>
        <AppSelect value={view} onChange={(event) => setView(event.target.value)}>
          <option value="board">전체 보드</option>
          <option value="today">오늘만</option>
          <option value="done">완료만</option>
        </AppSelect>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto rounded-[24px] border border-white/70 bg-white/35 p-3">
        <button type="button" onClick={() => setCategory("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === "all" ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}>
          전체 {(data.todos || []).filter((todo) => !todo.completed).length}
        </button>
        {categoryStats.map((item) => (
          <button key={item.name} type="button" onClick={() => setCategory(item.name)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${category === item.name ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}>
            {item.name} {item.count}
          </button>
        ))}
      </div>

      <TaskBoard
        sections={view === "today" ? [sections[0]] : view === "done" ? [sections[4]] : sections}
        today={today}
        onToggle={toggle}
        onToggleSubTask={toggleSubTask}
        onEdit={(todo) => setEditing(normalizeTodo(todo))}
        onDelay={delay}
        onStartTimer={(todo) => navigate(`/daily?startTimer=${todo.id}`)}
      />

      <Modal title={editing ? (editing.id ? "할 일 수정" : "할 일 추가") : ""} onClose={() => setEditing(null)}>
        {editing && (
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-bold">
              할 일
              <AppInput value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} placeholder="예: 클라이언트 수정본 전달" autoFocus />
            </label>

            <SubTaskEditor value={editing.subTasks || []} onChange={(subTasks) => setEditing({ ...editing, subTasks })} />

            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <label className="grid gap-1 text-sm font-bold">
                날짜
                <AppInput type="date" value={editing.dueDate || ""} onChange={(event) => setEditing({ ...editing, dueDate: event.target.value })} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                시작
                <AppInput type="time" value={editing.startTime || ""} disabled={editing.allDay} onChange={(event) => setEditing({ ...editing, startTime: event.target.value, dueTime: event.target.value })} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                종료
                <AppInput type="time" value={editing.endTime || ""} disabled={editing.allDay} onChange={(event) => setEditing({ ...editing, endTime: event.target.value })} />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
              하루종일
              <input type="checkbox" checked={Boolean(editing.allDay)} onChange={(event) => setEditing({ ...editing, allDay: event.target.checked, startTime: "", endTime: "", dueTime: "" })} />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                중요도
                <AppSelect value={editing.priority || "normal"} onChange={(event) => setEditing({ ...editing, priority: event.target.value })}>
                  <option value="high">매우 중요</option>
                  <option value="normal">보통</option>
                  <option value="low">가벼움</option>
                </AppSelect>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                분류
                <AppInput list="todo-category-list" value={editing.category || ""} onChange={(event) => setEditing({ ...editing, category: event.target.value })} placeholder="직접 입력하거나 선택" />
                <datalist id="todo-category-list">
                  {categories.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
            </div>

            <label className="grid gap-1 text-sm font-bold">
              메모
              <AppTextarea value={editing.memo || ""} onChange={(event) => setEditing({ ...editing, memo: event.target.value })} placeholder="맨 마지막에 필요한 설명만 적어두면 돼요." />
            </label>

            <div className="flex flex-wrap gap-2">
              <AppButton onClick={save}>저장</AppButton>
              {editing.id && <AppButton variant="danger" onClick={() => { deleteTodo(editing.id); setEditing(null); load(); }}>삭제</AppButton>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

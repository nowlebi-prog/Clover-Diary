import { useEffect, useState } from "react";
import GlassCard from "../common/GlassCard";
import CustomCheckbox from "../common/CustomCheckbox";
import SectionTitle from "../common/SectionTitle";
import { getTodos, updateTodo } from "../../lib/storage/localStorageAdapter";

const today = () => new Date().toISOString().slice(0, 10);

export default function TodoDock() {
  const [todos, setTodos] = useState([]);
  const load = () => setTodos(getTodos().filter((todo) => !todo.completed && (!todo.dueDate || todo.dueDate <= today())).slice(0, 6));
  useEffect(() => {
    load();
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);
  return (
    <div className="hidden w-80 shrink-0 lg:block">
      <GlassCard className="sticky top-5">
        <SectionTitle>오늘 할 일</SectionTitle>
        <div className="grid gap-2">
          {todos.map((todo) => (
            <CustomCheckbox key={todo.id} checked={todo.completed} label={todo.title} onChange={(value) => updateTodo(todo.id, { completed: value })} />
          ))}
          {!todos.length && <p className="text-sm text-clover-sub">오늘은 잔잔해요.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

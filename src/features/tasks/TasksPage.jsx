import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { createDelayedTask, createTop3, createTodo, deleteDelayedTask, deleteTodo, deleteTop3, getDelayedTasks, getTodos, getTop3, updateDelayedTask, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
import CrudPanel from "../shared/CrudPanel";

export default function TasksPage() {
  const [topCount, setTopCount] = useState(getTop3().length);
  useEffect(() => {
    const load = () => setTopCount(getTop3().length);
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);
  return (
    <>
      <PageHeader eyebrow="Tasks" title="할 일과 미룸 보관소" />
      <div className="grid gap-4">
        <GlassCard>
          <SectionTitle action={<AppButton variant="soft" onClick={() => topCount < 3 ? createTop3({ title: "새 TOP 3", completed: false, date: new Date().toISOString().slice(0, 10) }) : alert("TOP 3는 3개까지만 등록할 수 있어요.")}>TOP 3 추가</AppButton>}>오늘의 TOP 3</SectionTitle>
          <CrudPanel title="TOP 3" getItems={getTop3} createItem={createTop3} updateItem={updateTop3} deleteItem={deleteTop3} searchable={false} fields={[{ name: "title", label: "할 일", primary: true }, { name: "date", label: "날짜", type: "date" }, { name: "completed", label: "완료", type: "checkbox" }]} />
        </GlassCard>
        <CrudPanel
          title="전체 Todo"
          description="완료한 항목은 아래로 내려가고, 오늘/지난 마감은 빨간 배지로 표시됩니다."
          getItems={getTodos}
          createItem={createTodo}
          updateItem={updateTodo}
          deleteItem={deleteTodo}
          defaultItem={{ priority: "normal", category: "개인", completed: false, dueDate: new Date().toISOString().slice(0, 10) }}
          fields={[
            { name: "title", label: "할 일", primary: true },
            { name: "dueDate", label: "마감일", type: "date" },
            { name: "priority", label: "우선순위", type: "select", options: ["high", "normal", "low"] },
            { name: "category", label: "카테고리", type: "select", options: ["개인", "업무", "집안일", "돈", "콘텐츠", "체험단", "기타"] },
            { name: "project", label: "프로젝트" },
            { name: "assignee", label: "담당/연락처" },
            { name: "memo", label: "메모", type: "textarea" },
            { name: "completed", label: "완료", type: "checkbox" }
          ]}
        />
        <CrudPanel title="미룸 보관소" getItems={getDelayedTasks} createItem={createDelayedTask} updateItem={updateDelayedTask} deleteItem={deleteDelayedTask} fields={[{ name: "title", label: "항목", primary: true }, { name: "count", label: "미룬 횟수", type: "number" }, { name: "reason", label: "이유", type: "textarea" }]} />
      </div>
    </>
  );
}

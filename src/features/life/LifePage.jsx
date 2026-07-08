import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import { createChore, createHabit, createShoppingItem, deleteChore, deleteHabit, deleteShoppingItem, getChores, getHabits, getShoppingItems, updateChore, updateHabit, updateShoppingItem } from "../../lib/storage/localStorageAdapter";

export default function LifePage() {
  return (
    <>
      <PageHeader eyebrow="Life" title="생활 루틴" />
      <div className="grid gap-4">
        <CrudPanel title="반복 루틴" getItems={getHabits} createItem={createHabit} updateItem={updateHabit} deleteItem={deleteHabit} fields={[{ name: "title", label: "루틴", primary: true }, { name: "cycle", label: "반복 주기", type: "select", options: ["매일", "매주", "매월", "필요할 때"] }, { name: "nextDueDate", label: "다음 예정일", type: "date" }, { name: "completed", label: "완료", type: "checkbox" }]} />
        <CrudPanel title="집안일" getItems={getChores} createItem={createChore} updateItem={updateChore} deleteItem={deleteChore} fields={[{ name: "title", label: "할 일", primary: true }, { name: "cycle", label: "반복 주기", type: "select", options: ["매일", "매주", "매월", "필요할 때"] }, { name: "lastDoneAt", label: "마지막 완료일", type: "date" }, { name: "nextDueDate", label: "다음 예정일", type: "date" }, { name: "completed", label: "완료", type: "checkbox" }]} />
        <CrudPanel title="구매 필요 목록" getItems={getShoppingItems} createItem={createShoppingItem} updateItem={updateShoppingItem} deleteItem={deleteShoppingItem} fields={[{ name: "title", label: "구매 항목", primary: true }, { name: "category", label: "카테고리", type: "select", options: ["장보기", "생활용품", "업무", "기타"] }, { name: "memo", label: "메모" }, { name: "completed", label: "구매 완료", type: "checkbox" }]} />
      </div>
    </>
  );
}

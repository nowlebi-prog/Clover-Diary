import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import LifeHabitTracker from "../../components/habits/LifeHabitTracker";
import CrudPanel from "../shared/CrudPanel";
import {
  createChore,
  createShoppingItem,
  deleteChore,
  deleteShoppingItem,
  getChores,
  getAllData,
  getShoppingItems,
  updateChore,
  updateShoppingItem
} from "../../lib/storage/localStorageAdapter";

export default function LifePage() {
  const [data, setData] = useState(getAllData());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  return (
    <>
      <PageHeader eyebrow="LIFE" title="생활 허브">
        <div className="flex flex-wrap gap-2">
          <Link to="/habits"><AppButton variant="soft">Habits</AppButton></Link>
          <Link to="/journal"><AppButton variant="soft">Journal</AppButton></Link>
          <Link to="/mandalart"><AppButton variant="soft">Mandalart</AppButton></Link>
        </div>
      </PageHeader>

      <div className="grid gap-4">
        <LifeHabitTracker data={data} onChange={load} />

        <GlassCard>
          <SectionTitle>LIFE 안의 기능</SectionTitle>
          <p className="text-sm leading-relaxed text-clover-sub">
            습관, 기분, 회고, 집안일 루틴, 만다라트와 컨디션 기록을 LIFE 안에서 관리합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/habits"><AppButton>Habit tracker</AppButton></Link>
            <Link to="/journal"><AppButton variant="soft">Today journal</AppButton></Link>
            <Link to="/mandalart"><AppButton variant="soft">Mandalart</AppButton></Link>
          </div>
        </GlassCard>

        <CrudPanel title="Home Care" getItems={getChores} createItem={createChore} updateItem={updateChore} deleteItem={deleteChore} fields={[{ name: "title", label: "Task", primary: true }, { name: "cycle", label: "Cycle", type: "select", options: ["Daily", "Weekly", "Monthly", "When needed"] }, { name: "lastDoneAt", label: "Last done", type: "date" }, { name: "nextDueDate", label: "Next due", type: "date" }, { name: "completed", label: "Done", type: "checkbox" }]} />
        <CrudPanel title="Shopping list" getItems={getShoppingItems} createItem={createShoppingItem} updateItem={updateShoppingItem} deleteItem={deleteShoppingItem} fields={[{ name: "title", label: "Item", primary: true }, { name: "category", label: "Category", type: "select", options: ["Groceries", "Home supplies", "Work", "Other"] }, { name: "memo", label: "Memo" }, { name: "completed", label: "Bought", type: "checkbox" }]} />
      </div>
    </>
  );
}

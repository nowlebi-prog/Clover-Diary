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
      <PageHeader eyebrow="Life" title="Life routines">
        <div className="flex flex-wrap gap-2">
          <Link to="/habits"><AppButton variant="soft">Habits</AppButton></Link>
          <Link to="/money"><AppButton variant="soft">Money</AppButton></Link>
        </div>
      </PageHeader>
      <div className="grid gap-4">
        <LifeHabitTracker data={data} onChange={load} />

        <GlassCard>
          <SectionTitle>Life spaces</SectionTitle>
          <p className="text-sm leading-relaxed text-clover-sub">
            Habits, chores, shopping, money, and subscriptions live together here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/habits"><AppButton>Habit tracker</AppButton></Link>
            <Link to="/money"><AppButton variant="soft">Money check</AppButton></Link>
          </div>
        </GlassCard>
        <CrudPanel title="Chores" getItems={getChores} createItem={createChore} updateItem={updateChore} deleteItem={deleteChore} fields={[{ name: "title", label: "Task", primary: true }, { name: "cycle", label: "Cycle", type: "select", options: ["Daily", "Weekly", "Monthly", "When needed"] }, { name: "lastDoneAt", label: "Last done", type: "date" }, { name: "nextDueDate", label: "Next due", type: "date" }, { name: "completed", label: "Done", type: "checkbox" }]} />
        <CrudPanel title="Shopping list" getItems={getShoppingItems} createItem={createShoppingItem} updateItem={updateShoppingItem} deleteItem={deleteShoppingItem} fields={[{ name: "title", label: "Item", primary: true }, { name: "category", label: "Category", type: "select", options: ["Groceries", "Home supplies", "Work", "Other"] }, { name: "memo", label: "Memo" }, { name: "completed", label: "Bought", type: "checkbox" }]} />
      </div>
    </>
  );
}

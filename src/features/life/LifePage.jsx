import { Link } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import CrudPanel from "../shared/CrudPanel";
import {
  createChore,
  createShoppingItem,
  deleteChore,
  deleteShoppingItem,
  getChores,
  getShoppingItems,
  updateChore,
  updateShoppingItem
} from "../../lib/storage/localStorageAdapter";

export default function LifePage() {
  return (
    <>
      <PageHeader eyebrow="Life" title="Life routines">
        <Link to="/habits"><AppButton variant="soft">Open Habit Tracker</AppButton></Link>
      </PageHeader>
      <div className="grid gap-4">
        <GlassCard>
          <SectionTitle>Habit tracker moved up</SectionTitle>
          <p className="text-sm leading-relaxed text-clover-sub">
            Habits now have their own Notion-style tracker with daily checks, weekly and monthly views,
            yearly heatmaps, streaks, and paused habits.
          </p>
          <Link to="/habits"><AppButton className="mt-4">Go to Habits</AppButton></Link>
        </GlassCard>
        <CrudPanel title="Chores" getItems={getChores} createItem={createChore} updateItem={updateChore} deleteItem={deleteChore} fields={[{ name: "title", label: "Task", primary: true }, { name: "cycle", label: "Cycle", type: "select", options: ["Daily", "Weekly", "Monthly", "When needed"] }, { name: "lastDoneAt", label: "Last done", type: "date" }, { name: "nextDueDate", label: "Next due", type: "date" }, { name: "completed", label: "Done", type: "checkbox" }]} />
        <CrudPanel title="Shopping list" getItems={getShoppingItems} createItem={createShoppingItem} updateItem={updateShoppingItem} deleteItem={deleteShoppingItem} fields={[{ name: "title", label: "Item", primary: true }, { name: "category", label: "Category", type: "select", options: ["Groceries", "Home supplies", "Work", "Other"] }, { name: "memo", label: "Memo" }, { name: "completed", label: "Bought", type: "checkbox" }]} />
      </div>
    </>
  );
}

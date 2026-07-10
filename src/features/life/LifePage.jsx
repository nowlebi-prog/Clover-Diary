import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import LifeHabitTracker from "../../components/habits/LifeHabitTracker";
import CrudPanel from "../shared/CrudPanel";
import { getHabitCompletionRate, toDateKey } from "../../lib/utils/habitSelectors";
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
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86400000));
  const monthStart = `${today.slice(0, 8)}01`;
  const monthEnd = toDateKey(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const activeHabits = (data.habits || []).filter((habit) => habit.status !== "archived");
  const habitRate = activeHabits.length
    ? Math.round(activeHabits.reduce((sum, habit) => sum + getHabitCompletionRate(habit.id, data.habitLogs || [], monthStart, monthEnd), 0) / activeHabits.length)
    : 0;
  const moodByDate = (data.moodEntries || []).reduce((map, item) => ({ ...map, [item.date]: item }), {});
  let mandalartGoal = "";
  try {
    mandalartGoal = JSON.parse(localStorage.getItem("clover-desk:mandalart:v1") || "{}").mainGoal || "";
  } catch {
    mandalartGoal = "";
  }

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

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/habits" className="glass rounded-[24px] bg-emerald-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Habit tracker</p>
            <p className="mt-2 text-3xl font-black">{habitRate}%</p>
            <p className="mt-1 text-sm font-bold text-clover-sub">이번 달 전체 달성률</p>
          </Link>
          <Link to="/journal" className="glass rounded-[24px] bg-sky-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">오늘 기록</p>
            <div className="mt-4 flex h-20 items-end gap-3">
              {[yesterday, today].map((date) => {
                const score = Number(moodByDate[date]?.score || 0);
                const height = score ? `${score * 18}%` : "12%";
                return <span key={date} className="w-8 rounded-t-xl bg-sky-300" style={{ height }} title={date} />;
              })}
            </div>
            <p className="mt-2 text-sm font-bold text-clover-sub">어제와 오늘 기분 흐름</p>
          </Link>
          <Link to="/mandalart" className="glass rounded-[24px] bg-violet-50/70 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Mandalart</p>
            <p className="mt-3 line-clamp-2 text-lg font-black">{mandalartGoal || "내 삶의 최종 목표를 적어보세요"}</p>
            <p className="mt-2 text-sm font-bold text-clover-sub">삶의 방향표</p>
          </Link>
        </div>

        <CrudPanel title="집안일" getItems={getChores} createItem={createChore} updateItem={updateChore} deleteItem={deleteChore} fields={[{ name: "title", label: "할 일", primary: true }, { name: "cycle", label: "주기", type: "select", options: ["오늘", "이번 주", "이번 달", "필요할 때"] }, { name: "lastDoneAt", label: "마지막 완료일", type: "date" }, { name: "nextDueDate", label: "다음 예정일", type: "date" }, { name: "completed", label: "완료", type: "checkbox" }]} />
        <CrudPanel title="쇼핑 리스트" getItems={getShoppingItems} createItem={createShoppingItem} updateItem={updateShoppingItem} deleteItem={deleteShoppingItem} fields={[{ name: "title", label: "항목", primary: true }, { name: "category", label: "카테고리", type: "select", options: ["생필품", "식재료", "업무용", "기타"] }, { name: "completed", label: "구매 완료", type: "checkbox" }]} />
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import {
  GAP_YEAR_TODO_TITLE,
  getAllData,
  getUnregisteredGapYearExpenses,
  saveAllData
} from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const money = (value) => `${Number(value || 0).toLocaleString("ko-KR")}원`;

export default function GapYearPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const unregistered = getUnregisteredGapYearExpenses();
  const totalUnregistered = unregistered.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayTodo = (data.todos || []).find((item) => item.title === GAP_YEAR_TODO_TITLE && item.dueDate === today);

  const register = (item) => {
    const next = getAllData();
    next.expenses = (next.expenses || []).map((expense) => expense.id === item.id ? { ...expense, gapYearRegistered: true } : expense);
    saveAllData(next);
    load();
  };

  const toggleTodayTodo = () => {
    if (!todayTodo) return;
    const next = getAllData();
    next.todos = (next.todos || []).map((item) => item.id === todayTodo.id ? { ...item, completed: !item.completed, completedAt: !item.completed ? today : "" } : item);
    saveAllData(next);
    load();
  };

  return (
    <>
      <PageHeader eyebrow="GAP YEAR" title="갭이어 예산" />

      <GlassCard className="mb-4">
        <SectionTitle>오늘의 체크</SectionTitle>
        {todayTodo ? (
          <label className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold ${todayTodo.completed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {GAP_YEAR_TODO_TITLE}
            <input type="checkbox" checked={Boolean(todayTodo.completed)} onChange={toggleTodayTodo} />
          </label>
        ) : (
          <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 항목을 불러오는 중이에요.</p>
        )}
      </GlassCard>

      <GlassCard>
        <SectionTitle action={<span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">미등록 {unregistered.length}건 · {money(totalUnregistered)}</span>}>
          예산에 아직 안 올린 지출
        </SectionTitle>
        <div className="grid gap-2">
          {unregistered.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3 text-sm font-bold">
              <div className="min-w-0">
                <p className="truncate">{item.title || "지출"}</p>
                <p className="text-xs font-bold text-clover-sub">{item.date} · {item.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-rose-600">{money(item.amount)}</span>
                <button type="button" onClick={() => register(item)} className="rounded-full bg-clover-deep px-3 py-2 text-xs font-black text-white">등록 완료</button>
              </div>
            </div>
          ))}
          {!unregistered.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">모든 지출이 예산에 반영됐어요. 🎉</p>}
        </div>
      </GlassCard>
    </>
  );
}

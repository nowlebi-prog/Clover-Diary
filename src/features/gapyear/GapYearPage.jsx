import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { addDays, toDateKey } from "../../lib/utils/date";

const makeId = () => `gap-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function GapYearPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const monthStart = `${today.slice(0, 8)}01`;
  const days = useMemo(() => {
    const result = [];
    let current = monthStart;
    while (current <= today) {
      result.push(current);
      current = addDays(current, 1);
    }
    return result;
  }, [monthStart, today]);

  const load = () => setData(getAllData());
  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const uploadedMap = new Map((data.gapYearBudgets || []).map((item) => [item.date, item]));
  const missing = days.filter((date) => !uploadedMap.get(date)?.uploaded);

  const markUploaded = (date) => {
    const allData = getAllData();
    allData.gapYearBudgets = [
      { id: makeId(), date, uploaded: true, source: "manual", createdAt: today, updatedAt: today },
      ...(allData.gapYearBudgets || []).filter((item) => item.date !== date)
    ];
    saveAllData(allData);
    load();
  };

  return (
    <>
      <PageHeader eyebrow="GAP YEAR" title="갭이어 예산">
        <AppButton onClick={() => markUploaded(today)}>오늘 예산 올림</AppButton>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <GlassCard>
          <SectionTitle>이번 달 현황</SectionTitle>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const done = uploadedMap.get(date)?.uploaded;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => markUploaded(date)}
                  className={`rounded-2xl px-2 py-3 text-xs font-black ${done ? "bg-emerald-100 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                >
                  {Number(date.slice(-2))}
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>안 올린 예산</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missing.map((date) => (
              <article key={date} className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                <span>{date}</span>
                <button type="button" onClick={() => markUploaded(date)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black">완료</button>
              </article>
            ))}
            {!missing.length && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">이번 달 예산 업로드가 모두 완료됐어요.</p>}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

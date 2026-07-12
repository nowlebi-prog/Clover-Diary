import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import TimeTracker from "../../components/work/TimeTracker";
import WorkLog from "../../components/work/WorkLog";
import WorkStats from "../../components/work/WorkStats";
import { getActiveSession, getAllData, getWorkCategories, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

function WorkMemoPad({ today }) {
  const [memo, setMemo] = useState(() => getAllData().workMemos?.[today] || "");

  const save = () => {
    const data = getAllData();
    data.workMemos = { ...(data.workMemos || {}), [today]: memo };
    saveAllData(data);
  };

  return (
    <GlassCard>
      <SectionTitle>메모장</SectionTitle>
      <AppTextarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="업무 중 떠오른 생각, 이어 할 일, 회의 메모를 적어두세요." />
      <AppButton className="mt-3" variant="soft" onClick={save}>메모 저장</AppButton>
    </GlassCard>
  );
}

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const categories = getWorkCategories();
  const activeSession = getActiveSession();

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실">
        <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ 할 일 추가</AppButton>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,.95fr)_minmax(0,1.05fr)]">
        <TimeTracker activeSession={activeSession} categories={categories} onEnded={load} />
        <WorkStats sessions={data.workSessions || []} categories={categories} today={today} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <WorkLog sessions={data.workSessions || []} categories={categories} today={today} />
        <WorkMemoPad today={today} />
      </div>
    </>
  );
}

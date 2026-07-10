import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";
import TimeTracker from "../../components/work/TimeTracker";
import TodoPanel from "../../components/work/TodoPanel";
import WorkLog from "../../components/work/WorkLog";
import WorkStats from "../../components/work/WorkStats";
import CategoryManager from "../../components/work/CategoryManager";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import { getAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const spaceLink = "rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep transition hover:bg-white/80";

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());

  useEffect(() => {
    const load = () => setData(getAllData());
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const contents = data.contentPlans || [];
  const campaigns = data.campaigns || [];

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실" />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid content-start gap-4">
          <TimeTracker activeSession={data.activeSession} categories={data.workCategories} />
          <TodoPanel todos={data.todos} today={today} />
          <CategoryManager categories={data.workCategories} />
        </div>

        <div className="grid content-start gap-4">
          <WorkStats sessions={data.workSessions} categories={data.workCategories} today={today} weeklyGoalHours={data.weeklyGoalHours} />
          <WorkLog sessions={data.workSessions} categories={data.workCategories} today={today} />
          <GlassCard>
            <SectionTitle>WORK 안의 다른 기능</SectionTitle>
            <div className="grid gap-2">
              <Link to="/tasks" className={spaceLink}>Tasks · 전체 할 일 보드</Link>
              <Link to="/daily" className={spaceLink}>Time Block · 오늘 일정 계획</Link>
              <Link to="/campaigns" className={spaceLink}>Projects · 프로젝트/캠페인 {campaigns.length}개</Link>
              <Link to="/content" className={spaceLink}>Content · 발행 계획 {contents.length}개</Link>
              <Link to="/files" className={spaceLink}>Files · 중요 파일</Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import CustomCheckbox from "../../components/common/CustomCheckbox";
import MonthMiniCalendar from "../../components/dashboard/MonthMiniCalendar";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayItems } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const linkClass = "rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep transition hover:bg-white/80";

export default function PlanPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const todayItems = getTodayItems(data, today);
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  return (
    <>
      <PageHeader eyebrow="PLAN" title="계획 허브">
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "event" }))}>+ 일정 추가</AppButton>
          <Link to="/calendar"><AppButton variant="soft">Calendar</AppButton></Link>
          <Link to="/daily"><AppButton variant="soft">Daily</AppButton></Link>
          <Link to="/mandalart"><AppButton variant="soft">Mandalart</AppButton></Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <MonthMiniCalendar data={data} />
          <GlassCard>
            <SectionTitle>오늘 타임라인</SectionTitle>
            <TodayTimeline items={todayItems} />
            <Link to="/daily"><AppButton className="mt-4" variant="soft">Daily 열기</AppButton></Link>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>이번 주 핵심 목표</SectionTitle>
            <p className="mb-3 text-sm text-clover-sub">이번 주를 잡아주는 중요한 3가지만 남겨둡니다.</p>
            <div className="grid gap-2">
              {data.top3.slice(0, 3).map((item) => (
                <CustomCheckbox
                  key={item.id}
                  checked={item.completed}
                  label={item.title}
                  onChange={(checked) => updateTop3(item.id, { completed: checked })}
                />
              ))}
              {!data.top3.length && <p className="text-sm text-clover-sub">이번 주 목표가 아직 없어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>PLAN 안의 기능</SectionTitle>
            <div className="grid gap-2">
              <Link to="/calendar" className={linkClass}>Calendar · 월간 일정</Link>
              <Link to="/daily" className={linkClass}>Daily · 하루 타임라인</Link>
              <Link to="/mandalart" className={linkClass}>Mandalart · 장기 목표</Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

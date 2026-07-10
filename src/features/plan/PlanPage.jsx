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
      <PageHeader eyebrow="Planner" title="Planner">
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "event" }))}>+ Schedule</AppButton>
          <Link to="/daily"><AppButton variant="soft">Daily timeline</AppButton></Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <MonthMiniCalendar data={data} />
          <GlassCard>
            <SectionTitle>Daily timeline</SectionTitle>
            <TodayTimeline items={todayItems} />
            <Link to="/daily"><AppButton className="mt-4" variant="soft">Open daily notes</AppButton></Link>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>Weekly goals</SectionTitle>
            <p className="mb-3 text-sm text-clover-sub">Keep the week anchored with the top things that matter.</p>
            <div className="grid gap-2">
              {data.top3.slice(0, 3).map((item) => (
                <CustomCheckbox
                  key={item.id}
                  checked={item.completed}
                  label={item.title}
                  onChange={(checked) => updateTop3(item.id, { completed: checked })}
                />
              ))}
              {!data.top3.length && <p className="text-sm text-clover-sub">No weekly goals yet.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>Plan spaces</SectionTitle>
            <div className="grid gap-2">
              <Link to="/calendar" className="rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep">Monthly schedule</Link>
              <Link to="/daily" className="rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep">Daily timeline</Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

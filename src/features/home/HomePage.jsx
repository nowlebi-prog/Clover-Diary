import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import CustomCheckbox from "../../components/common/CustomCheckbox";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StatusBadge from "../../components/common/StatusBadge";
import DeadlineList from "../../components/dashboard/DeadlineList";
import IncompleteTodoList from "../../components/dashboard/IncompleteTodoList";
import MonthMiniCalendar from "../../components/dashboard/MonthMiniCalendar";
import QuickMemoPad from "../../components/dashboard/QuickMemoPad";
import TodayTimeline from "../../components/dashboard/TodayTimeline";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, updateTodo, updateTop3 } from "../../lib/storage/localStorageAdapter";
import { getTodayHabitStatus } from "../../lib/utils/habitSelectors";
import { toDateKey } from "../../lib/utils/date";
import { getCampaignAlerts, getIncompleteTodos, getTodayItems, getUpcomingDeadlines, getUpcomingPayments, getWeeklyContentPlans } from "../../lib/utils/dashboardSelectors";

const money = (value) => Number(value || 0).toLocaleString("ko-KR");

export default function HomePage() {
  const [data, setData] = useState(getAllData());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const today = toDateKey(new Date());
  const todayItems = getTodayItems(data, today);
  const deadlines = getUpcomingDeadlines(data, today);
  const incomplete = getIncompleteTodos(data);
  const payments = getUpcomingPayments(data, today);
  const content = getWeeklyContentPlans(data, today);
  const campaigns = getCampaignAlerts(data, today);
  const habitStatus = getTodayHabitStatus(data.habits, data.habitLogs, today);
  const paid = data.payments.filter((item) => item.status === "입금 완료").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const unpaid = data.payments.filter((item) => item.status !== "입금 완료").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <>
      <PageHeader eyebrow={today} title="Today command board">
        <div className="flex flex-wrap gap-2">
          <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ Todo</AppButton>
          <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "event" }))}>+ Event</AppButton>
          <AppButton variant="soft" onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "memo" }))}>+ Memo</AppButton>
        </div>
      </PageHeader>
      <p className="-mt-3 mb-5 text-sm text-clover-sub">Sort the heart and the day first. The rest can move one calm step at a time.</p>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <SectionTitle>Must-do TOP 3</SectionTitle>
          <p className="mb-3 text-sm text-clover-sub">If these three move, today counts.</p>
          <div className="grid gap-2">
            {data.top3.slice(0, 3).map((item) => (
              <CustomCheckbox key={item.id} checked={item.completed} label={item.title} onChange={(checked) => updateTop3(item.id, { completed: checked })} />
            ))}
            {!data.top3.length && <p className="text-sm text-clover-sub">No TOP 3 yet. Add your anchors in Tasks.</p>}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>Urgent deadlines</SectionTitle>
          <DeadlineList items={deadlines.slice(0, 5)} today={today} />
        </GlassCard>

        <GlassCard className="xl:col-span-2">
          <SectionTitle>Today timeline</SectionTitle>
          <TodayTimeline items={todayItems} />
        </GlassCard>

        <GlassCard>
          <SectionTitle>Open todos</SectionTitle>
          <IncompleteTodoList todos={incomplete} today={today} onToggle={(id, completed) => updateTodo(id, { completed, completedAt: completed ? today : "" })} />
        </GlassCard>

        <div className="xl:col-span-2">
          <MonthMiniCalendar data={data} />
        </div>

        <GlassCard>
          <QuickMemoPad memos={data.inboxMemos} />
        </GlassCard>

        <GlassCard>
          <SectionTitle>Payment summary</SectionTitle>
          <p className="text-2xl font-bold text-clover-deep">{money(paid)} won</p>
          <p className="text-sm text-clover-sub">Paid</p>
          <p className="mt-3 text-lg font-bold text-red-500">{money(unpaid)} won pending</p>
          <div className="mt-4 grid gap-2">
            {payments.slice(0, 3).map((item) => <p key={item.id} className="rounded-2xl bg-white/50 p-3 text-sm"><b>{item.expectedDate}</b> · {item.project}</p>)}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle>Content this week</SectionTitle>
          {content.slice(0, 4).map((item) => <p key={item.id} className="mb-2 rounded-2xl bg-white/50 p-3 text-sm"><b>{item.channel}</b> · {item.title}</p>)}
          {!content.length && <p className="text-sm text-clover-sub">No content scheduled this week.</p>}
        </GlassCard>

        <GlassCard>
          <SectionTitle>Campaign alerts</SectionTitle>
          {campaigns.slice(0, 4).map((item) => <p key={item.id} className="mb-2 rounded-2xl bg-white/50 p-3 text-sm"><b>{item.status}</b> · {item.name}</p>)}
          {!campaigns.length && <p className="text-sm text-clover-sub">No campaign deadlines nearby.</p>}
        </GlassCard>

        <GlassCard>
          <SectionTitle>Today habits</SectionTitle>
          <p className="text-2xl font-bold text-clover-deep">{habitStatus.doneCount}/{habitStatus.total}</p>
          <div className="my-3 h-3 overflow-hidden rounded-full bg-white/60">
            <div className="h-full rounded-full bg-clover-deep" style={{ width: `${habitStatus.rate}%` }} />
          </div>
          <StatusBadge tone={habitStatus.rate === 100 ? "done" : "warning"}>{habitStatus.rate}% complete</StatusBadge>
        </GlassCard>
      </div>
    </>
  );
}

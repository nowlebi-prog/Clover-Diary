import { Link } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData } from "../../lib/storage/localStorageAdapter";
import { getIncompleteTodos, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const spaceLink = "rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep transition hover:bg-white/80";

export default function WorkPage() {
  const data = getAllData();
  const today = toDateKey(new Date());
  const todos = getIncompleteTodos(data);
  const deadlines = getUpcomingDeadlines(data, today);
  const contents = data.contentPlans || [];
  const payments = data.payments || [];
  const campaigns = data.campaigns || [];

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무와 프로젝트">
        <AppButton onClick={() => window.dispatchEvent(new Event("clover-quick-add"))}>+ 빠른 추가</AppButton>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <GlassCard>
            <SectionTitle>오늘 처리할 업무</SectionTitle>
            <div className="grid gap-2">
              {todos.slice(0, 6).map((todo) => (
                <Link key={todo.id} to="/tasks" className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
                  <span className="mr-2 text-clover-deep">{todo.priority === "high" ? "중요" : "Todo"}</span>
                  {todo.title}
                </Link>
              ))}
              {!todos.length && <p className="text-sm text-clover-sub">남은 업무가 없어요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>가까운 마감</SectionTitle>
            <div className="grid gap-2">
              {deadlines.slice(0, 6).map((item, index) => (
                <Link key={`${item.type}-${item.id || index}`} to={item.type === "payment" ? "/money" : item.type === "content" ? "/content" : "/tasks"} className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
                  <span className="truncate">{item.displayTitle}</span>
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">D{item.dday >= 0 ? `-${item.dday}` : `+${Math.abs(item.dday)}`}</span>
                </Link>
              ))}
              {!deadlines.length && <p className="text-sm text-clover-sub">다가오는 마감이 없어요.</p>}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>WORK 안의 기능</SectionTitle>
            <div className="grid gap-2">
              <Link to="/tasks" className={spaceLink}>Tasks · 전체 할 일 {todos.length}개</Link>
              <Link to="/campaigns" className={spaceLink}>Projects · 프로젝트/캠페인 {campaigns.length}개</Link>
              <Link to="/content" className={spaceLink}>Content · 발행 계획 {contents.length}개</Link>
              <Link to="/money" className={spaceLink}>Money · 결제/입금 {payments.length}개</Link>
              <Link to="/files" className={spaceLink}>Files · 중요 파일</Link>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>운영 메모</SectionTitle>
            <p className="text-sm leading-relaxed text-clover-sub">
              업무, 콘텐츠, 결제와 마감은 WORK에서 관리하고 HOME과 PLAN에는 오늘 필요한 요약만 보여줍니다.
            </p>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import DurationTimeline from "../../components/dashboard/DurationTimeline";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { getIncompleteTodos, getUpcomingDeadlines } from "../../lib/utils/dashboardSelectors";
import { toDateKey } from "../../lib/utils/date";

const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const pad = (hour) => `${String(hour).padStart(2, "0")}:00`;
const spaceLink = "rounded-[20px] bg-white/55 px-4 py-3 text-sm font-bold text-clover-deep transition hover:bg-white/80";

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const [active, setActive] = useState(null);
  const today = toDateKey(new Date());

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const todos = getIncompleteTodos(data);
  const deadlines = getUpcomingDeadlines(data, today);
  const contents = data.contentPlans || [];
  const campaigns = data.campaigns || [];
  const trackables = useMemo(() => [
    ...todos.slice(0, 8).map((item) => ({ id: item.id, type: "todo", title: item.title })),
    ...(data.events || []).filter((item) => item.date === today).map((item) => ({ id: item.id, type: "event", title: item.title }))
  ], [todos, data.events, today]);

  const durationItems = [
    ...(data.timelineEntries || []).filter((item) => item.date === today).map((item) => ({ ...item, title: item.title || "기록" })),
    ...(data.events || []).filter((item) => item.date === today).map((item) => ({ ...item, title: item.title || "일정" })),
    ...(data.todos || []).filter((item) => item.dueDate === today && (item.startTime || item.dueTime)).map((item) => ({ ...item, time: item.startTime || item.dueTime, title: item.title || "할 일" })),
    ...(data.timeSessions || []).filter((item) => item.date === today).map((item) => ({ ...item, time: new Date(item.startedAt).toTimeString().slice(0, 5), title: item.title || "작업" }))
  ];

  const commit = (recipe) => {
    const next = getAllData();
    recipe(next);
    saveAllData(next);
    setData(getAllData());
  };

  const saveTimelineDrafts = (entries) => {
    commit((next) => {
      const savedAt = toDateKey(new Date());
      const newEntries = entries.map((entry) => ({
        id: makeId("timeline"),
        date: today,
        time: pad(entry.startHour ?? entry.hour ?? 0),
        startTime: pad(entry.startHour ?? entry.hour ?? 0),
        endTime: pad(entry.endHour ?? (entry.startHour ?? entry.hour ?? 0) + 1),
        title: entry.title,
        memo: "",
        createdAt: savedAt,
        updatedAt: savedAt
      }));
      next.timelineEntries = [...newEntries, ...(next.timelineEntries || [])];
    });
  };

  const startTracker = (target) => setActive({ ...target, startedAt: Date.now() });

  const stopTracker = () => {
    if (!active) return;
    const endedAt = Date.now();
    commit((next) => {
      next.timeSessions = [
        {
          id: makeId("time"),
          date: today,
          targetId: active.id,
          targetType: active.type,
          title: active.title,
          startedAt: active.startedAt,
          endedAt,
          minutes: Math.max(1, Math.round((endedAt - active.startedAt) / 60000)),
          createdAt: today,
          updatedAt: today
        },
        ...(next.timeSessions || [])
      ];
    });
    setActive(null);
  };

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실">
        <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ 할 일 추가</AppButton>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="grid gap-4">
          <DurationTimeline items={durationItems} date={today} onSaveEntries={saveTimelineDrafts} />

          <div className="grid gap-4 xl:grid-cols-2">
            <GlassCard>
              <SectionTitle>오늘 처리할 업무</SectionTitle>
              <div className="grid gap-2">
                {todos.slice(0, 6).map((todo) => (
                  <Link key={todo.id} to="/tasks" className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
                    <span className="mr-2 text-clover-deep">{todo.priority === "high" ? "중요" : "Todo"}</span>
                    {todo.title}
                  </Link>
                ))}
                {!todos.length && <p className="text-sm font-bold text-clover-sub">남은 업무가 없어요.</p>}
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
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <GlassCard>
            <SectionTitle>업무 타이머</SectionTitle>
            {active ? (
              <div className="rounded-[22px] bg-emerald-50 p-4">
                <p className="font-black">{active.title}</p>
                <p className="mt-1 text-sm font-bold text-clover-sub">진행 중이에요. 끝나면 저장됩니다.</p>
                <AppButton className="mt-3 w-full" variant="danger" onClick={stopTracker}>종료하고 저장</AppButton>
              </div>
            ) : (
              <div className="grid gap-2">
                {trackables.map((item) => (
                  <button key={`${item.type}-${item.id}`} onClick={() => startTracker(item)} className="rounded-2xl bg-white/55 p-3 text-left text-sm font-bold">{item.title}</button>
                ))}
                {!trackables.length && <p className="text-sm font-bold text-clover-sub">오늘 실행할 업무를 먼저 추가해보세요.</p>}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <SectionTitle>WORK 바로가기</SectionTitle>
            <div className="grid gap-2">
              <Link to="/tasks" className={spaceLink}>전체 할 일 {todos.length}개</Link>
              <Link to="/campaigns" className={spaceLink}>프로젝트 / 캠페인 {campaigns.length}개</Link>
              <Link to="/content" className={spaceLink}>콘텐츠 계획 {contents.length}개</Link>
              <Link to="/files" className={spaceLink}>자료 / 파일 메모</Link>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>오늘 사용 시간</SectionTitle>
            <div className="grid gap-2">
              {(data.timeSessions || []).filter((item) => item.date === today).slice(0, 6).map((item) => (
                <p key={item.id} className="rounded-2xl bg-white/55 p-3 text-sm"><b>{item.title}</b> · {item.minutes}분</p>
              ))}
              {!data.timeSessions?.some((item) => item.date === today) && <p className="text-sm font-bold text-clover-sub">아직 기록된 시간이 없어요.</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

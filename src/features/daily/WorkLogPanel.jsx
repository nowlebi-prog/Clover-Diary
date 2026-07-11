import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import { getAllData, getWorkLogNote, saveWorkLogNote } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const fmtMinutes = (sec) => Math.round((sec || 0) / 60);

const fmtDuration = (sec) => {
  const min = fmtMinutes(sec);
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
};

const weekDates = (base) => {
  const day = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateKey(d);
  });
};

export default function WorkLogPanel() {
  const today = toDateKey(new Date());
  const [data, setData] = useState(getAllData());
  const [range, setRange] = useState("today");
  const [nextTodoDraft, setNextTodoDraft] = useState(getWorkLogNote(today).nextTodo || "");

  useEffect(() => {
    const load = () => setData(getAllData());
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const dateKeys = useMemo(() => (range === "today" ? [today] : weekDates(new Date())), [range, today]);

  const sessions = useMemo(
    () => (data.workSessions || []).filter((session) => dateKeys.includes(session.date)).sort((a, b) => b.startTime - a.startTime),
    [data.workSessions, dateKeys]
  );

  const totalFocusSec = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const totalBreakSec = sessions.reduce((sum, session) => sum + (session.pauseSec || 0), 0);

  const categoryTotals = useMemo(() => {
    const totals = {};
    sessions.forEach((session) => {
      const segments = session.categoryLog?.length ? session.categoryLog : [{ category: session.category, start: session.startTime, end: session.endTime }];
      segments.forEach((seg) => {
        const sec = Math.max(0, Math.floor(((seg.end ?? session.endTime) - seg.start) / 1000));
        totals[seg.category] = (totals[seg.category] || 0) + sec;
      });
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const saveNextTodo = () => saveWorkLogNote(today, { nextTodo: nextTodoDraft });

  return (
    <GlassCard>
      <SectionTitle
        action={
          <div className="flex gap-1 rounded-full bg-white/60 p-1 text-xs font-bold">
            <button className={`rounded-full px-3 py-1 ${range === "today" ? "bg-clover-deep text-white" : "text-clover-sub"}`} onClick={() => setRange("today")}>오늘</button>
            <button className={`rounded-full px-3 py-1 ${range === "week" ? "bg-clover-deep text-white" : "text-clover-sub"}`} onClick={() => setRange("week")}>주간</button>
          </div>
        }
      >
        업무일지
      </SectionTitle>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/60 p-3 text-center">
          <p className="text-xs font-bold text-clover-sub">실제 집중 시간</p>
          <p className="mt-1 text-lg font-black text-clover-deep">{fmtDuration(totalFocusSec)}</p>
        </div>
        <div className="rounded-2xl bg-white/60 p-3 text-center">
          <p className="text-xs font-bold text-clover-sub">쉬는 시간</p>
          <p className="mt-1 text-lg font-black text-amber-600">{fmtDuration(totalBreakSec)}</p>
        </div>
      </div>

      {!!categoryTotals.length && (
        <div className="mb-4 grid gap-2">
          <p className="text-xs font-bold text-clover-sub">카테고리별 시간</p>
          {categoryTotals.map(([cat, sec]) => (
            <div key={cat} className="flex items-center justify-between rounded-xl bg-white/45 px-3 py-2 text-sm">
              <span className="font-bold">{cat}</span>
              <span className="text-clover-sub">{fmtDuration(sec)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <p className="text-xs font-bold text-clover-sub">한 일 ({sessions.length})</p>
        {sessions.map((session) => (
          <article key={session.id} className="rounded-2xl bg-white/55 p-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold">{session.category}</span>
              <span className="text-xs text-clover-sub">
                {new Date(session.startTime).toTimeString().slice(0, 5)} ~ {new Date(session.endTime).toTimeString().slice(0, 5)} · {fmtDuration(session.duration)}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold">{session.actualWork}</p>
            {session.linkedTodoTitle && <p className="mt-1 text-xs text-clover-sub">🔗 {session.linkedTodoTitle}</p>}
            {!!session.memos?.length && (
              <div className="mt-2 grid gap-1">
                {session.memos.map((memo, index) => (
                  <p key={index} className="text-xs text-clover-sub">
                    {new Date(memo.time).toTimeString().slice(0, 5)} · {memo.text}
                  </p>
                ))}
              </div>
            )}
          </article>
        ))}
        {!sessions.length && <p className="rounded-2xl bg-white/40 p-4 text-center text-sm text-clover-sub">{range === "today" ? "오늘 기록된 업무가 아직 없어요." : "이번 주 기록된 업무가 아직 없어요."}</p>}
      </div>

      <div className="mt-4 rounded-2xl bg-[#FFFDF5]/80 p-3">
        <p className="mb-2 text-xs font-bold text-clover-sub">내일 이어갈 일</p>
        <AppTextarea value={nextTodoDraft} onChange={(event) => setNextTodoDraft(event.target.value)} placeholder="오늘 마무리 못한 것, 내일 먼저 할 것을 적어두세요." />
        <AppButton className="mt-2" variant="soft" onClick={saveNextTodo}>저장</AppButton>
      </div>
    </GlassCard>
  );
}

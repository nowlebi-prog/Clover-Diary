import { useMemo } from "react";
import GlassCard from "../common/GlassCard";
import { fmtHM } from "../../lib/utils/workUtils";
import { addDays } from "../../lib/utils/date";

export default function WorkStats({ sessions = [], categories = [], today, weeklyGoalHours = 40 }) {
  const stats = useMemo(() => {
    const weekStart = addDays(today, -6);
    const monthKey = today.slice(0, 7);
    const todaySessions = sessions.filter((s) => s.date === today);
    const weekSessions = sessions.filter((s) => s.date >= weekStart && s.date <= today);
    const monthSessions = sessions.filter((s) => (s.date || "").startsWith(monthKey));

    const sum = (list) => list.reduce((acc, s) => acc + s.duration, 0);
    const byCategory = {};
    weekSessions.forEach((s) => {
      byCategory[s.category] = (byCategory[s.category] || 0) + s.duration;
    });
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const weekSec = sum(weekSessions);
    const goalSec = weeklyGoalHours * 3600;

    return {
      todaySec: sum(todaySessions),
      weekSec,
      monthSec: sum(monthSessions),
      goalRate: goalSec ? Math.min(Math.round((weekSec / goalSec) * 100), 999) : 0,
      sessionCount: weekSessions.length,
      avgSec: weekSessions.length ? Math.round(weekSec / weekSessions.length) : 0,
      byCategory,
      topCategory
    };
  }, [sessions, today, weeklyGoalHours]);

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategorySec = categoryEntries[0]?.[1] || 1;

  return (
    <GlassCard className="p-5">
      <h2 className="mb-3 text-base font-black">이번주 작업 통계</h2>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/55 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">오늘</p>
          <p className="mt-1 text-sm font-black text-clover-deep">{fmtHM(stats.todaySec)}</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">이번주</p>
          <p className="mt-1 text-sm font-black text-clover-deep">{fmtHM(stats.weekSec)}</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">이번달</p>
          <p className="mt-1 text-sm font-black text-clover-deep">{fmtHM(stats.monthSec)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-clover-sub">
          <span>주간 목표 {weeklyGoalHours}시간 대비</span>
          <span>{stats.goalRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/70">
          <div className="h-2 rounded-full bg-clover-primary" style={{ width: `${Math.min(stats.goalRate, 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-1.5">
        {categoryEntries.map(([name, sec]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-[11px] font-bold text-clover-sub">{name}</span>
            <div className="h-2 flex-1 rounded-full bg-white/60">
              <div
                className="h-2 rounded-full"
                style={{ width: `${(sec / maxCategorySec) * 100}%`, background: categories.find((c) => c.name === name)?.color || "#8DDFA8" }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[11px] font-bold text-clover-sub">{fmtHM(sec)}</span>
          </div>
        ))}
        {!categoryEntries.length && <p className="text-xs text-clover-sub">이번주 기록이 아직 없어요.</p>}
      </div>

      <div className="mt-4 flex justify-between text-[11px] font-bold text-clover-sub">
        <span>세션 {stats.sessionCount}건</span>
        <span>평균 {fmtHM(stats.avgSec)}</span>
        <span>최다 작업 · {stats.topCategory?.[0] || "-"}</span>
      </div>
    </GlassCard>
  );
}

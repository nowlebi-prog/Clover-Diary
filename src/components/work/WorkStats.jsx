import { useMemo } from "react";
import GlassCard from "../common/GlassCard";
import { addDays } from "../../lib/utils/date";
import { fmtHM } from "../../lib/utils/workUtils";

export default function WorkStats({ sessions = [], categories = [], today, weeklyGoalHours = 40 }) {
  const stats = useMemo(() => {
    const weekStart = addDays(today, -6);
    const monthKey = today.slice(0, 7);
    const todaySessions = sessions.filter((session) => session.date === today);
    const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date <= today);
    const monthSessions = sessions.filter((session) => (session.date || "").startsWith(monthKey));
    const sum = (list) => list.reduce((total, session) => total + Number(session.duration || 0), 0);
    const byCategory = {};

    todaySessions.forEach((session) => {
      byCategory[session.category] = (byCategory[session.category] || 0) + Number(session.duration || 0);
    });

    const monthByDay = Array.from({ length: Number(today.slice(-2)) }, (_, index) => {
      const day = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
      return { day: index + 1, sec: sum(monthSessions.filter((session) => session.date === day)) };
    });

    const weekSec = sum(weekSessions);
    const goalSec = weeklyGoalHours * 3600;

    return {
      todaySec: sum(todaySessions),
      weekSec,
      monthSec: sum(monthSessions),
      goalRate: goalSec ? Math.min(Math.round((weekSec / goalSec) * 100), 999) : 0,
      byCategory,
      monthByDay
    };
  }, [sessions, today, weeklyGoalHours]);

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategorySec = categoryEntries[0]?.[1] || 1;
  const maxDaySec = Math.max(...stats.monthByDay.map((item) => item.sec), 1);

  return (
    <GlassCard className="p-5">
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 px-4 py-4">
          <p className="text-sm font-black text-emerald-700">오늘 집중</p>
          <p className="mt-1 text-3xl font-black text-clover-text">{fmtHM(stats.todaySec)}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 px-4 py-4">
          <p className="text-sm font-black text-sky-700">이번 달 집중</p>
          <p className="mt-1 text-3xl font-black text-clover-text">{fmtHM(stats.monthSec)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white/55 p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-clover-sub">
          <span>주간 목표 {weeklyGoalHours}시간</span>
          <span>{stats.goalRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-white">
          <div className="h-2 rounded-full bg-clover-primary" style={{ width: `${Math.min(stats.goalRate, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs font-bold text-clover-sub">
          <span>주간 누적</span>
          <span>{fmtHM(stats.weekSec)}</span>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-black text-clover-text">일간 카테고리 그래프</h3>
        <div className="grid gap-2">
          {categoryEntries.map(([name, sec]) => (
            <div key={name} className="grid grid-cols-[70px_1fr_58px] items-center gap-2 text-xs font-bold">
              <span className="truncate text-clover-sub">{name}</span>
              <div className="h-2 rounded-full bg-white/70">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(sec / maxCategorySec) * 100}%`,
                    background: categories.find((category) => category.name === name)?.color || "#8DDFA8"
                  }}
                />
              </div>
              <span className="text-right text-clover-sub">{fmtHM(sec)}</span>
            </div>
          ))}
          {!categoryEntries.length && <p className="text-sm font-bold text-clover-sub">오늘 기록이 아직 없어요.</p>}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-black text-clover-text">월간 그래프</h3>
        <div className="flex h-20 items-end gap-2 overflow-x-auto rounded-2xl bg-white/45 px-3 py-3">
          {stats.monthByDay.map((item) => (
            <div key={item.day} className="flex min-w-4 flex-col items-center gap-1">
              <span
                className="w-2 rounded-full bg-emerald-300"
                style={{ height: `${Math.max(6, (item.sec / maxDaySec) * 54)}px` }}
              />
              <span className="text-[10px] font-bold text-clover-sub">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

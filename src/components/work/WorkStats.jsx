import { useMemo } from "react";
import GlassCard from "../common/GlassCard";
import { fmtHM } from "../../lib/utils/workUtils";

const WEEK_GOAL_SEC = 40 * 3600;

const startOfWeek = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().slice(0, 10);
};

export default function WorkStats({ sessions = [], categories = [], today }) {
  const stats = useMemo(() => {
    const weekStart = startOfWeek(today);
    const monthKey = today.slice(0, 7);
    const todaySessions = sessions.filter((session) => session.date === today);
    const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date <= today);
    const monthSessions = sessions.filter((session) => (session.date || "").startsWith(monthKey));
    const monthDays = Array.from({ length: new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate() }, (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`);
    const sum = (list) => list.reduce((total, session) => total + Number(session.duration || 0), 0);
    const byCategory = {};
    todaySessions.forEach((session) => {
      byCategory[session.category] = (byCategory[session.category] || 0) + Number(session.duration || 0);
    });
    const monthByDay = monthDays.map((date) => ({ date, sec: sum(monthSessions.filter((session) => session.date === date)) }));
    return {
      todaySec: sum(todaySessions),
      weekSec: sum(weekSessions),
      monthSec: sum(monthSessions),
      byCategory,
      monthByDay
    };
  }, [sessions, today]);

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryEntries.map(([, sec]) => sec));
  const maxDay = Math.max(1, ...stats.monthByDay.map((item) => item.sec));
  const progress = Math.min(100, Math.round((stats.weekSec / WEEK_GOAL_SEC) * 100));

  return (
    <GlassCard className="overflow-hidden">
      <div className="mb-4 flex items-center gap-4 rounded-[24px] bg-white/50 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-clover-ink text-sm font-black text-white">
          {progress}%
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-clover-deep">Workroom</p>
          <div className="mt-2 grid gap-1 text-sm font-bold">
            <p className="flex justify-between gap-3"><span className="text-clover-sub">주간 목표</span><b>40시간</b></p>
            <p className="flex justify-between gap-3"><span className="text-clover-sub">주간 누적</span><b className="text-amber-500">{fmtHM(stats.weekSec)}</b></p>
            <p className="flex justify-between gap-3"><span className="text-clover-sub">오늘 누적</span><b>{fmtHM(stats.todaySec)}</b></p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-700">오늘 집중</p>
          <p className="mt-1 text-2xl font-black">{fmtHM(stats.todaySec)}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-xs font-black text-sky-700">이번 달 집중</p>
          <p className="mt-1 text-2xl font-black">{fmtHM(stats.monthSec)}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <section>
          <h3 className="mb-2 text-sm font-black">일간 카테고리 그래프</h3>
          <div className="grid gap-2">
            {categoryEntries.map(([name, sec]) => (
              <div key={name} className="grid grid-cols-[76px_1fr_56px] items-center gap-2 text-xs">
                <span className="truncate font-bold text-clover-sub">{name}</span>
                <div className="h-2 rounded-full bg-white/70">
                  <div className="h-2 rounded-full" style={{ width: `${(sec / maxCategory) * 100}%`, background: categories.find((cat) => cat.name === name)?.color || "#8DDFA8" }} />
                </div>
                <span className="text-right font-bold text-clover-sub">{fmtHM(sec)}</span>
              </div>
            ))}
            {!categoryEntries.length && <p className="text-xs font-bold text-clover-sub">오늘 기록이 아직 없어요.</p>}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-black">월간 그래프</h3>
          <div className="flex h-24 items-end gap-1 overflow-x-auto rounded-2xl bg-white/45 p-2">
            {stats.monthByDay.map((item) => (
              <div key={item.date} className="flex min-w-4 flex-col items-center justify-end gap-1">
                <span className="w-2 rounded-full bg-clover-primary" style={{ height: `${Math.max(4, (item.sec / maxDay) * 68)}px` }} />
                <span className="text-[9px] font-bold text-clover-sub">{Number(item.date.slice(-2))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </GlassCard>
  );
}

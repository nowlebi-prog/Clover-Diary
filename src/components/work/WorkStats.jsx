import { useMemo } from "react";
import GlassCard from "../common/GlassCard";
import SectionTitle from "../common/SectionTitle";
import { fmtHM } from "../../lib/utils/workUtils";

export default function WorkStats({ sessions = [], categories = [], today }) {
  const stats = useMemo(() => {
    const todaySessions = sessions.filter((session) => session.date === today);
    const todaySec = todaySessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);
    const byCategory = {};

    todaySessions.forEach((session) => {
      const name = session.category || "기타";
      byCategory[name] = (byCategory[name] || 0) + Number(session.duration || 0);
    });

    return {
      todaySec,
      entries: Object.entries(byCategory).sort((a, b) => b[1] - a[1])
    };
  }, [sessions, today]);

  const maxSec = Math.max(...stats.entries.map(([, sec]) => sec), 1);

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionTitle>오늘 집중</SectionTitle>
        <p className="text-3xl font-black text-clover-ink">{fmtHM(stats.todaySec)}</p>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-black text-clover-text">카테고리별 사용 시간</p>
        {stats.entries.map(([name, sec]) => {
          const color = categories.find((category) => category.name === name)?.color || "#8DDFA8";
          return (
            <div key={name} className="grid grid-cols-[88px_1fr_58px] items-center gap-2 text-xs font-bold">
              <span className="truncate text-clover-sub">{name}</span>
              <div className="h-2.5 rounded-full bg-white/80">
                <div className="h-2.5 rounded-full" style={{ width: `${Math.max(8, (sec / maxSec) * 100)}%`, background: color }} />
              </div>
              <span className="text-right text-clover-ink">{fmtHM(sec)}</span>
            </div>
          );
        })}
        {!stats.entries.length && (
          <p className="rounded-2xl bg-white/50 p-4 text-sm font-bold text-clover-sub">
            오늘 기록된 집중 시간이 아직 없어요. 타이머를 시작하거나 수동으로 추가해보세요.
          </p>
        )}
      </div>
    </GlassCard>
  );
}

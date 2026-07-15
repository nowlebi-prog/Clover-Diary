import { useMemo } from "react";
import GlassCard from "../common/GlassCard";
import SectionTitle from "../common/SectionTitle";
import { fmtHM } from "../../lib/utils/workUtils";

function StatRow({ label, color, seconds, maxSeconds }) {
  const width = seconds > 0 ? Math.max(8, (seconds / maxSeconds) * 100) : 0;
  return (
    <div className="grid grid-cols-[112px_1fr_64px] items-center gap-2 text-xs font-bold">
      <span className="truncate text-clover-sub">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/80">
        <div className="h-2.5 rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-right text-clover-ink">{fmtHM(seconds)}</span>
    </div>
  );
}

export default function WorkStats({ sessions = [], categories = [], today }) {
  const stats = useMemo(() => {
    const todaySessions = sessions.filter((session) => session.date === today);
    const todaySec = todaySessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);
    const categoryMap = new Map(categories.map((category) => [category.name, category]));
    const byGroup = {};
    const byDetail = {};

    todaySessions.forEach((session) => {
      const detail = session.category || "기타";
      const group = session.categoryGroup || categoryMap.get(detail)?.group || "업무";
      const seconds = Number(session.duration || 0);
      byGroup[group] = (byGroup[group] || 0) + seconds;
      byDetail[`${group}:${detail}`] = {
        group,
        detail,
        color: categoryMap.get(detail)?.color || "#8DDFA8",
        seconds: (byDetail[`${group}:${detail}`]?.seconds || 0) + seconds
      };
    });

    return {
      todaySec,
      groupEntries: Object.entries(byGroup).sort((a, b) => b[1] - a[1]),
      detailEntries: Object.values(byDetail).sort((a, b) => b.seconds - a.seconds)
    };
  }, [sessions, categories, today]);

  const maxGroupSec = Math.max(...stats.groupEntries.map(([, sec]) => sec), 1);
  const maxDetailSec = Math.max(...stats.detailEntries.map((item) => item.seconds), 1);
  const groupColor = (groupName) => categories.find((category) => category.group === groupName)?.color || "#8DDFA8";

  return (
    <GlassCard className="rounded-[18px] border border-clover-line bg-white/82 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SectionTitle>오늘 집중</SectionTitle>
        <p className="text-3xl font-black text-clover-ink">{fmtHM(stats.todaySec)}</p>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-black text-clover-text">큰 분류별 사용 시간</p>
        {stats.groupEntries.map(([name, sec]) => (
          <StatRow key={name} label={name} color={groupColor(name)} seconds={sec} maxSeconds={maxGroupSec} />
        ))}

        <p className="mt-3 text-sm font-black text-clover-text">세부 분류별 사용 시간</p>
        {stats.detailEntries.map((item) => (
          <StatRow
            key={`${item.group}-${item.detail}`}
            label={`${item.group} · ${item.detail}`}
            color={item.color}
            seconds={item.seconds}
            maxSeconds={maxDetailSec}
          />
        ))}

        {!stats.detailEntries.length && (
          <p className="rounded-2xl bg-white/50 p-4 text-sm font-bold text-clover-sub">
            오늘 기록된 집중 시간이 아직 없어요. 타이머를 시작하거나 수동으로 추가해보세요.
          </p>
        )}
      </div>
    </GlassCard>
  );
}

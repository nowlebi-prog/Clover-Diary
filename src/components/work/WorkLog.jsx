import { useMemo, useState } from "react";
import GlassCard from "../common/GlassCard";
import SessionCard from "./SessionCard";
import { fmtHM, fmtDateLabel } from "../../lib/utils/workUtils";
import { addDays } from "../../lib/utils/date";

const FILTERS = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "all", label: "전체" }
];

export default function WorkLog({ sessions = [], categories = [], today }) {
  const [filter, setFilter] = useState("today");

  const filtered = useMemo(() => {
    if (filter === "all") return sessions;
    if (filter === "today") return sessions.filter((session) => session.date === today);
    if (filter === "week") {
      const weekAgo = addDays(today, -6);
      return sessions.filter((session) => session.date >= weekAgo && session.date <= today);
    }
    const monthKey = today.slice(0, 7);
    return sessions.filter((session) => (session.date || "").startsWith(monthKey));
  }, [sessions, filter, today]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((session) => {
      map[session.date] = [...(map[session.date] || []), session];
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <GlassCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-black">근무일지</h2>
        <div className="flex gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === item.key ? "bg-clover-deep text-white" : "bg-white/60 text-clover-sub hover:bg-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {grouped.map(([date, list]) => {
          const dayTotal = list.reduce((sum, session) => sum + Number(session.duration || 0), 0);
          return (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black text-clover-deep">{fmtDateLabel(date)}</p>
                <p className="text-xs font-bold text-clover-sub">총 {fmtHM(dayTotal)} · {list.length}건</p>
              </div>
              <div className="grid gap-2">
                {list.sort((a, b) => b.startTime - a.startTime).map((session) => (
                  <SessionCard key={session.id} session={session} categories={categories} siblingSessions={list} />
                ))}
              </div>
            </div>
          );
        })}
        {!grouped.length && <p className="rounded-2xl bg-white/45 p-4 text-sm text-clover-sub">선택한 기간의 업무 기록이 없어요.</p>}
      </div>
    </GlassCard>
  );
}

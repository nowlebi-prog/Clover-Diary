import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppTextarea from "../common/AppTextarea";
import GlassCard from "../common/GlassCard";
import SessionCard from "./SessionCard";
import { getWorkLogNote, saveWorkLogNote } from "../../lib/storage/localStorageAdapter";
import { addDays } from "../../lib/utils/date";
import { fmtDateLabel, fmtHM } from "../../lib/utils/workUtils";

const FILTERS = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번 주" },
  { key: "month", label: "이번 달" },
  { key: "all", label: "전체" }
];

export default function WorkLog({ sessions = [], categories = [], today, onChange }) {
  const [filter, setFilter] = useState("today");
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = getWorkLogNote(today);
    setNote(saved.body || saved.nextTodo || "");
  }, [today]);

  const todaySessions = useMemo(() => sessions.filter((session) => session.date === today), [sessions, today]);
  const todayTotal = todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0);

  const filtered = useMemo(() => {
    if (filter === "all") return sessions;
    if (filter === "today") return todaySessions;
    if (filter === "week") {
      const weekAgo = addDays(today, -6);
      return sessions.filter((session) => session.date >= weekAgo && session.date <= today);
    }
    const monthKey = today.slice(0, 7);
    return sessions.filter((session) => (session.date || "").startsWith(monthKey));
  }, [filter, sessions, today, todaySessions]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((session) => {
      map[session.date] = [...(map[session.date] || []), session];
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const saveNote = () => {
    saveWorkLogNote(today, {
      body: note,
      nextTodo: note,
      updatedAt: new Date().toISOString()
    });
    onChange?.();
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black">
          오늘의 근무일지 <span className="text-sm text-clover-sub">({todaySessions.length}건 · {fmtHM(todayTotal)})</span>
        </h2>
        <div className="flex gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${
                filter === item.key ? "bg-clover-deep text-white" : "bg-white/65 text-clover-sub hover:bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[26px] border border-amber-200 bg-amber-50/45 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-black text-amber-800">오늘의 근무 일지</h3>
          <AppButton variant="soft" onClick={saveNote}>저장</AppButton>
        </div>
        <AppTextarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="오늘 업무 흐름, 막힌 점, 내일 이어갈 일을 따로 적어두세요."
          className="min-h-[120px]"
        />
      </div>

      <div className="my-5 border-t border-dashed border-clover-sub/20" />

      <div className="grid gap-4">
        {grouped.map(([date, list]) => {
          const dayTotal = list.reduce((sum, session) => sum + (session.duration || 0), 0);
          return (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black text-clover-deep">{fmtDateLabel(date)}</p>
                <p className="text-xs font-bold text-clover-sub">총 {fmtHM(dayTotal)} · {list.length}건</p>
              </div>
              <div className="grid gap-2">
                {list
                  .slice()
                  .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
                  .map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      categories={categories}
                      siblingSessions={list}
                      onChange={onChange}
                    />
                  ))}
              </div>
            </div>
          );
        })}
        {!grouped.length && (
          <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">
            선택한 기간의 업무 기록이 없어요.
          </p>
        )}
      </div>
    </GlassCard>
  );
}

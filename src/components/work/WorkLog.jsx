import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import GlassCard from "../common/GlassCard";
import SessionCard from "./SessionCard";
import { createStudyCapture, createWorkSession, getWorkLogNote, saveWorkLogNote } from "../../lib/storage/localStorageAdapter";
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
  const [studyNeeded, setStudyNeeded] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState(() => ({
    date: today,
    title: "",
    category: categories[0]?.name || "업무",
    start: "09:00",
    end: "10:00",
    memo: ""
  }));
  const [manualError, setManualError] = useState("");
  const summaryKey = filter === "today" ? today : filter === "week" ? `${today}-week` : filter === "month" ? `${today.slice(0, 7)}-month` : "all";

  useEffect(() => {
    const saved = getWorkLogNote(summaryKey);
    setNote(saved.body || saved.nextTodo || "");
    setStudyNeeded(Boolean(saved.studyNeeded));
  }, [summaryKey]);

  useEffect(() => {
    setManual((current) => ({
      ...current,
      date: current.date || today,
      category: current.category || categories[0]?.name || "업무"
    }));
  }, [categories, today]);

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
  const filteredTotal = filtered.reduce((sum, session) => sum + (session.duration || 0), 0);
  const periodLabel = FILTERS.find((item) => item.key === filter)?.label || "선택 기간";

  const saveNote = () => {
    saveWorkLogNote(summaryKey, {
      body: note,
      nextTodo: note,
      period: filter,
      studyNeeded,
      updatedAt: new Date().toISOString()
    });
    if (studyNeeded && note.trim()) {
      createStudyCapture({
        title: `업무 회고 공부 필요 - ${periodLabel}`,
        summary: note.trim(),
        status: "waiting",
        source: "worklog",
        category: "업무 회고",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    onChange?.();
  };

  const timeToMs = (dateKey, timeValue) => {
    const [hour = 0, minute = 0] = String(timeValue || "00:00").split(":").map(Number);
    const date = new Date(`${dateKey}T00:00:00`);
    date.setHours(hour, minute, 0, 0);
    return date.getTime();
  };

  const saveManualSession = () => {
    const title = manual.title.trim();
    if (!title) {
      setManualError("업무명을 적어주세요.");
      return;
    }
    const startTime = timeToMs(manual.date, manual.start);
    let endTime = timeToMs(manual.date, manual.end);
    if (endTime <= startTime) endTime += 24 * 3600 * 1000;
    const duration = Math.max(0, Math.round((endTime - startTime) / 1000));
    createWorkSession({
      title,
      actualWork: title,
      category: manual.category || categories[0]?.name || "업무",
      date: manual.date,
      startTime,
      endTime,
      duration,
      pauseSec: 0,
      pauses: [],
      memos: manual.memo.trim() ? [{ id: `memo-${Date.now()}`, text: manual.memo.trim(), phase: "note" }] : [],
      categoryLog: [{ category: manual.category || categories[0]?.name || "업무", start: startTime, end: endTime }],
      manual: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setManual((current) => ({ ...current, title: "", memo: "" }));
    setManualError("");
    setFilter("today");
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

      <div className="mb-4 grid gap-3 rounded-[20px] border border-clover-line bg-white/60 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-black text-clover-sub">기간</p>
          <p className="mt-1 text-lg font-black text-clover-ink">{periodLabel}</p>
        </div>
        <div>
          <p className="text-xs font-black text-clover-sub">총 근무시간</p>
          <p className="mt-1 text-lg font-black text-clover-deep">{fmtHM(filteredTotal)}</p>
        </div>
        <div>
          <p className="text-xs font-black text-clover-sub">기록</p>
          <p className="mt-1 text-lg font-black text-clover-ink">{filtered.length}건</p>
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
        <label className="mt-3 flex items-center gap-2 text-sm font-black text-clover-deep">
          <input type="checkbox" checked={studyNeeded} onChange={(event) => setStudyNeeded(event.target.checked)} />
          공부 필요로 Study에 보내기
        </label>
      </div>

      <div className="mt-4 rounded-[22px] border border-clover-line bg-white/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-clover-ink">타이머 깜빡했을 때</h3>
            <p className="text-xs font-bold text-clover-sub">이미 한 업무 시간을 직접 추가할 수 있어요.</p>
          </div>
          <AppButton variant="soft" onClick={() => setManualOpen((value) => !value)}>
            {manualOpen ? "닫기" : "+ 수동 기록 추가"}
          </AppButton>
        </div>
        {manualOpen && (
          <div className="mt-4 grid gap-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_1fr]">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={manual.date} onChange={(event) => setManual((current) => ({ ...current, date: event.target.value }))} /></label>
              <label className="grid gap-1 text-sm font-bold">업무명<AppInput value={manual.title} onChange={(event) => setManual((current) => ({ ...current, title: event.target.value }))} placeholder="예: 클라이언트 수정본 전달" /></label>
              <label className="grid gap-1 text-sm font-bold">
                카테고리
                <AppSelect value={manual.category} onChange={(event) => setManual((current) => ({ ...current, category: event.target.value }))}>
                  {(categories.length ? categories : [{ name: "업무" }, { name: "회의" }, { name: "기획" }, { name: "잡무" }]).map((category) => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </AppSelect>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">시작<AppInput type="time" value={manual.start} onChange={(event) => setManual((current) => ({ ...current, start: event.target.value }))} /></label>
              <label className="grid gap-1 text-sm font-bold">종료<AppInput type="time" value={manual.end} onChange={(event) => setManual((current) => ({ ...current, end: event.target.value }))} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={manual.memo} onChange={(event) => setManual((current) => ({ ...current, memo: event.target.value }))} placeholder="선택 사항" className="min-h-[74px]" /></label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {manualError ? <p className="text-xs font-black text-clover-danger">{manualError}</p> : <span />}
              <AppButton onClick={saveManualSession}>기록 저장</AppButton>
            </div>
          </div>
        )}
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

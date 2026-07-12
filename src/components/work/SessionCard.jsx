import { useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import { updateWorkSession, deleteWorkSession } from "../../lib/storage/localStorageAdapter";
import { fmtHM, fmtClock, findOverlap, categoryColor } from "../../lib/utils/workUtils";

function toTimeInputValue(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function applyTimeToDate(ms, timeValue) {
  const [h, m] = timeValue.split(":").map(Number);
  const d = new Date(ms);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export default function SessionCard({ session, categories = [], siblingSessions = [], readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [memoDraft, setMemoDraft] = useState("");

  const startEdit = () => {
    setDraft({
      title: session.title,
      start: toTimeInputValue(session.startTime),
      end: toTimeInputValue(session.endTime)
    });
    setError("");
    setEditing(true);
  };

  const save = () => {
    const startTime = applyTimeToDate(session.startTime, draft.start);
    let endTime = applyTimeToDate(session.startTime, draft.end);
    if (endTime <= startTime) endTime += 24 * 3600 * 1000;
    const candidate = { ...session, startTime, endTime };
    const overlap = findOverlap(candidate, siblingSessions);
    if (overlap) {
      setError(`"${overlap.title}" 업무와 시간이 겹쳐요.`);
      return;
    }
    const duration = Math.max(Math.round((endTime - startTime) / 1000) - Number(session.pauseSec || 0), 0);
    updateWorkSession(session.id, { title: draft.title.trim() || session.title, startTime, endTime, duration });
    setEditing(false);
  };

  const addMemo = () => {
    if (!memoDraft.trim()) return;
    updateWorkSession(session.id, {
      memos: [...(session.memos || []), { id: `memo-${Date.now()}`, text: memoDraft.trim(), phase: "note" }]
    });
    setMemoDraft("");
  };

  return (
    <article className="rounded-[22px] border border-white/70 bg-white/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <AppInput value={draft.title} onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))} />
          ) : (
            <p className="truncate text-sm font-black">{session.title || "미작성"}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: categoryColor(categories, session.category) }}>
              {session.category || "업무"}
            </span>
            <span className="text-[11px] font-bold text-clover-sub">{fmtClock(session.startTime)} ~ {fmtClock(session.endTime)}</span>
            {session.pauseSec > 0 && <span className="text-[11px] text-clover-sub">쉬는 시간 {fmtHM(session.pauseSec)}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <b className="block text-base font-black">{fmtHM(session.duration)}</b>
          {!readOnly && (
            <div className="mt-2 flex gap-2 text-xs font-bold">
              {editing ? (
                <>
                  <button className="text-clover-deep" onClick={save}>저장</button>
                  <button className="text-clover-sub" onClick={() => setEditing(false)}>취소</button>
                </>
              ) : (
                <>
                  <button className="text-clover-sub hover:text-clover-deep" onClick={startEdit}>수정</button>
                  <button className="text-clover-sub hover:text-clover-danger" onClick={() => deleteWorkSession(session.id)}>삭제</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <input type="time" value={draft.start} onChange={(event) => setDraft((d) => ({ ...d, start: event.target.value }))} className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5" />
          <span className="text-clover-sub">~</span>
          <input type="time" value={draft.end} onChange={(event) => setDraft((d) => ({ ...d, end: event.target.value }))} className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5" />
        </div>
      )}
      {error && <p className="mt-2 text-xs font-bold text-clover-danger">{error}</p>}

      {!!session.memos?.length && (
        <div className="mt-3 grid gap-1">
          {session.memos.map((memo) => (
            <div key={memo.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-1.5 text-xs text-clover-sub">
              <span>{memo.phase === "break" ? "쉬는 시간" : "메모"} · {memo.text}</span>
              {!readOnly && (
                <button
                  className="shrink-0 text-clover-sub hover:text-clover-danger"
                  onClick={() => updateWorkSession(session.id, { memos: session.memos.filter((m) => m.id !== memo.id) })}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <AppInput
            placeholder="이 업무에 메모 추가"
            value={memoDraft}
            onChange={(event) => setMemoDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addMemo()}
          />
          <AppButton className="min-h-10 px-3 text-xs" variant="soft" onClick={addMemo}>추가</AppButton>
        </div>
      )}
    </article>
  );
}

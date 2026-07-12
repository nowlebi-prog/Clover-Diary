import { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import GlassCard from "../common/GlassCard";
import {
  addActiveSessionMemo,
  discardActiveSession,
  endActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  startActiveSession,
  updateActiveSession
} from "../../lib/storage/localStorageAdapter";
import { computeElapsed, fmtHMS, fmtHM } from "../../lib/utils/workUtils";

export default function TimeTracker({ activeSession, categories, onEnded }) {
  const [tick, setTick] = useState(Date.now());
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState(categories[0]?.name || "업무");
  const [memoText, setMemoText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession?.id]);

  if (!activeSession) {
    return (
      <GlassCard className="bg-white/75">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-clover-deep">Focus Timer</p>
        <div className="grid gap-3">
          <AppInput placeholder="지금 시작할 업무명을 적어주세요" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id || category.name}
                onClick={() => setDraftCategory(category.name)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition"
                style={{ background: draftCategory === category.name ? category.color : "#ffffff90", color: draftCategory === category.name ? "#1F2A24" : "#7A887F" }}
              >
                {category.name}
              </button>
            ))}
          </div>
          <AppButton
            disabled={!draftTitle.trim()}
            onClick={() => {
              startActiveSession({ title: draftTitle.trim(), category: draftCategory });
              setDraftTitle("");
            }}
          >
            업무 시작
          </AppButton>
        </div>
      </GlassCard>
    );
  }

  const { workSec, pauseSec, isPaused } = computeElapsed(activeSession, tick);

  const addMemo = () => {
    if (!memoText.trim()) return;
    addActiveSessionMemo(memoText.trim(), isPaused ? "break" : "working");
    setMemoText("");
  };

  return (
    <GlassCard className="bg-gradient-to-br from-emerald-50/80 to-white/70">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">{isPaused ? "쉬는 중" : "집중 중"}</p>
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: categories.find((category) => category.name === activeSession.category)?.color || "#8DDFA8" }}>
          {activeSession.category}
        </span>
      </div>

      {editingTitle ? (
        <div className="mb-2 flex gap-2">
          <AppInput value={titleInput} onChange={(event) => setTitleInput(event.target.value)} autoFocus />
          <AppButton className="min-h-9 px-3 py-1 text-xs" onClick={() => { updateActiveSession({ title: titleInput.trim() || activeSession.title }); setEditingTitle(false); }}>저장</AppButton>
        </div>
      ) : (
        <button className="mb-2 text-left text-lg font-black text-clover-text" onClick={() => { setTitleInput(activeSession.title); setEditingTitle(true); }}>
          {activeSession.title} <span className="text-xs font-bold text-clover-sub">· 수정</span>
        </button>
      )}

      <div className="mb-4 font-mono text-4xl font-black tracking-tight text-clover-deep">{fmtHMS(workSec)}</div>
      {pauseSec > 0 && <p className="-mt-3 mb-4 text-xs font-bold text-clover-sub">휴식 {fmtHM(pauseSec)} 포함</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {isPaused ? <AppButton onClick={resumeActiveSession}>재개</AppButton> : <AppButton variant="soft" onClick={pauseActiveSession}>휴식</AppButton>}
        <AppButton variant="danger" onClick={() => { const session = endActiveSession(); onEnded?.(session); }}>업무 종료</AppButton>
        <AppButton variant="ghost" onClick={discardActiveSession}>취소</AppButton>
      </div>

      <div className="flex gap-2">
        <AppInput placeholder={isPaused ? "휴식 중 메모" : "중간 메모"} value={memoText} onChange={(event) => setMemoText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addMemo()} />
        <AppButton className="min-h-11 px-4" variant="soft" onClick={addMemo}>추가</AppButton>
      </div>

      {!!activeSession.memos?.length && (
        <div className="mt-3 grid gap-1.5">
          {activeSession.memos.map((memo) => (
            <p key={memo.id} className="rounded-xl bg-white/60 px-3 py-2 text-xs text-clover-sub">
              <span className="mr-1 font-bold text-clover-deep">{memo.phase === "break" ? "휴식" : "메모"}</span>
              {memo.text}
            </p>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

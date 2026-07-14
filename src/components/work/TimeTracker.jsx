import { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import {
  addActiveSessionMemo,
  discardActiveSession,
  endActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  startActiveSession,
  updateActiveSession
} from "../../lib/storage/localStorageAdapter";
import { computeElapsed, fmtHM, fmtHMS } from "../../lib/utils/workUtils";

const focusValue = (item) => item.focusId || item.id;

const formatMemoTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}시 ${minute}분`;
};

export default function TimeTracker({ activeSession, categories = [], todos = [], onChange }) {
  const [tick, setTick] = useState(Date.now());
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState(categories[0]?.name || "업무");
  const [draftTodoId, setDraftTodoId] = useState("");
  const [memoText, setMemoText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession?.id]);

  useEffect(() => {
    if (!categories.some((category) => category.name === draftCategory)) {
      setDraftCategory(categories[0]?.name || "업무");
    }
  }, [categories, draftCategory]);

  useEffect(() => {
    const selected = todos.find((todo) => focusValue(todo) === draftTodoId);
    if (!selected) return;
    setDraftTitle(selected.title || "");
    setDraftCategory(selected.category || selected.project || "업무");
  }, [draftTodoId, todos]);

  const selectedColor = categories.find((category) => category.name === draftCategory)?.color || "#8DDFA8";

  const addMemo = () => {
    if (!memoText.trim()) return;
    addActiveSessionMemo(memoText.trim(), activeSession && computeElapsed(activeSession, tick).isPaused ? "break" : "working");
    setMemoText("");
    onChange?.();
  };

  if (!activeSession) {
    return (
      <section className="glass rounded-[18px] border border-clover-line bg-white/82 p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-clover-deep">Focus Timer</p>
          <span className="rounded-full px-3 py-1 text-xs font-black text-clover-text" style={{ background: selectedColor }}>
            대기
          </span>
        </div>
        <div className="mx-auto grid max-w-xl gap-4 text-center">
          <AppSelect value={draftTodoId} onChange={(event) => setDraftTodoId(event.target.value)}>
            <option value="">직접 입력해서 시작</option>
            {todos.map((todo) => (
              <option key={focusValue(todo)} value={focusValue(todo)}>
                {todo.timeLabel ? `${todo.timeLabel} · ${todo.title}` : todo.title}
              </option>
            ))}
          </AppSelect>
          <AppInput
            placeholder="지금 시작할 업무명을 적어주세요"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
          />
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id || category.name}
                type="button"
                onClick={() => setDraftCategory(category.name)}
                className="rounded-full px-3 py-1.5 text-xs font-black transition"
                style={{
                  background: draftCategory === category.name ? category.color : "#ffffff90",
                  color: draftCategory === category.name ? "#1F2A24" : "#718077"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
          <AppButton
            className="mx-auto w-full max-w-sm"
            disabled={!draftTitle.trim()}
            onClick={() => {
              const selected = todos.find((todo) => focusValue(todo) === draftTodoId);
              startActiveSession({
                title: draftTitle.trim(),
                category: draftCategory,
                todoId: selected?.source === "todo" || selected?.type === "todo" ? selected.id : ""
              });
              setDraftTitle("");
              setDraftTodoId("");
              onChange?.();
            }}
          >
            업무 시작
          </AppButton>
        </div>
      </section>
    );
  }

  const { workSec, pauseSec, isPaused } = computeElapsed(activeSession, tick);
  const categoryColor = categories.find((category) => category.name === activeSession.category)?.color || "#8DDFA8";

  return (
    <section className="glass rounded-[18px] border border-clover-line bg-white/82 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-clover-deep">
          {isPaused ? "쉬는 중" : "집중 중"}
        </p>
        <span className="rounded-full px-3 py-1 text-xs font-black text-clover-text" style={{ background: categoryColor }}>
          {activeSession.category}
        </span>
      </div>

      {editingTitle ? (
        <div className="mb-3 flex gap-2">
          <AppInput value={titleInput} onChange={(event) => setTitleInput(event.target.value)} autoFocus />
          <AppButton
            className="px-3"
            onClick={() => {
              updateActiveSession({ title: titleInput.trim() || activeSession.title });
              setEditingTitle(false);
              onChange?.();
            }}
          >
            저장
          </AppButton>
        </div>
      ) : (
        <button
          type="button"
          className="mb-2 text-left text-xl font-black text-clover-text"
          onClick={() => {
            setTitleInput(activeSession.title);
            setEditingTitle(true);
          }}
        >
          {activeSession.title} <span className="text-xs font-bold text-clover-sub">· 수정</span>
        </button>
      )}

      <div className="mb-4 text-center font-mono text-6xl font-black tracking-tight text-clover-deep md:text-7xl">{fmtHMS(workSec)}</div>
      {pauseSec > 0 && <p className="-mt-3 mb-4 text-xs font-bold text-clover-sub">쉬는 시간 {fmtHM(pauseSec)} 포함</p>}

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {isPaused ? (
          <AppButton onClick={() => { resumeActiveSession(); onChange?.(); }}>다시 시작</AppButton>
        ) : (
          <AppButton variant="soft" onClick={() => { pauseActiveSession(); onChange?.(); }}>휴식</AppButton>
        )}
        <AppButton
          variant="danger"
          onClick={() => {
            endActiveSession();
            onChange?.();
          }}
        >
          업무 종료
        </AppButton>
        <AppButton variant="ghost" onClick={() => { discardActiveSession(); onChange?.(); }}>취소</AppButton>
      </div>

      <div className="flex gap-2">
        <AppInput
          placeholder={isPaused ? "쉬는 중 메모" : "중간 메모"}
          value={memoText}
          onChange={(event) => setMemoText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addMemo();
          }}
        />
        <AppButton className="px-4" variant="soft" onClick={addMemo}>추가</AppButton>
      </div>

      {!!activeSession.memos?.length && (
        <div className="mt-3 grid gap-1.5">
          {activeSession.memos.map((memo) => (
            <p key={memo.id} className="rounded-xl bg-white/60 px-3 py-2 text-xs text-clover-sub">
              <span className="mr-2 font-black text-clover-deep">{formatMemoTime(memo.time)}</span>
              <span className="mr-1 font-bold text-clover-deep">{memo.phase === "break" ? "휴식" : "업무"}</span>
              {memo.text}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

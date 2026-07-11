import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import GlassCard from "../../components/common/GlassCard";
import Modal from "../../components/common/Modal";
import SectionTitle from "../../components/common/SectionTitle";
import {
  createWorkSession,
  getActiveWorkTimer,
  getAllData,
  getTaskCategories,
  saveTaskCategories,
  setActiveWorkTimer,
  updateTodo
} from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fmtHMS = (totalSec) => {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtTime = (ts) => new Date(ts).toTimeString().slice(0, 5);

export default function WorkTimer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [timer, setTimer] = useState(getActiveWorkTimer());
  const [categories, setCategories] = useState(getTaskCategories());
  const [tick, setTick] = useState(0); // forces re-render every second while running
  const [midMemoText, setMidMemoText] = useState("");
  const [planName, setPlanName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [actualWorkDraft, setActualWorkDraft] = useState("");
  const [editingStart, setEditingStart] = useState(false);
  const [startEditValue, setStartEditValue] = useState("");
  const intervalRef = useRef(null);
  const pendingLinkRef = useRef(null);

  const refresh = () => setTimer(getActiveWorkTimer());

  useEffect(() => {
    const onChange = () => {
      refresh();
      setCategories(getTaskCategories());
    };
    window.addEventListener("clover-data-change", onChange);
    return () => window.removeEventListener("clover-data-change", onChange);
  }, []);

  // Pull in a todo to start timing when navigated here from Tasks (?startTimer=todoId)
  useEffect(() => {
    const startTodoId = searchParams.get("startTimer");
    if (!startTodoId || timer) return;
    const todo = (getAllData().todos || []).find((item) => item.id === startTodoId);
    if (todo) {
      setPlanName(todo.title);
      pendingLinkRef.current = todo.id;
    }
    searchParams.delete("startTimer");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams]);

  useEffect(() => {
    if (timer && !timer.paused) {
      intervalRef.current = setInterval(() => setTick((value) => value + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer?.running, timer?.paused]);

  const elapsedSec = useMemo(() => {
    if (!timer) return 0;
    const segSec = !timer.paused && timer.segStart ? Math.floor((Date.now() - timer.segStart) / 1000) : 0;
    return (timer.accumSec || 0) + segSec;
  }, [timer, tick]);

  const pauseElapsedSec = useMemo(() => {
    if (!timer || !timer.paused || !timer.pauseStart) return 0;
    return Math.floor((Date.now() - timer.pauseStart) / 1000);
  }, [timer, tick]);

  const commitTimer = (next) => {
    setActiveWorkTimer(next);
    setTimer(next);
  };

  const handleStart = () => {
    const now = Date.now();
    const category = categories[0] || "업무";
    const startTodoId = pendingLinkRef.current;
    pendingLinkRef.current = null;
    const label = planName.trim();
    const next = {
      running: true,
      paused: false,
      startTime: now,
      segStart: now,
      accumSec: 0,
      taskCat: category,
      pauseStart: 0,
      pauseLog: [],
      categoryLog: [],
      categorySegStart: now,
      midMemos: label ? [{ time: now, text: label, duringPause: false }] : [],
      linkedTodoId: startTodoId,
      linkedTodoTitle: label || null,
      planLabel: label
    };
    setPlanName("");
    commitTimer(next);
  };

  const handlePause = () => {
    if (!timer || timer.paused) return;
    const now = Date.now();
    const segSec = timer.segStart ? Math.floor((now - timer.segStart) / 1000) : 0;
    commitTimer({ ...timer, paused: true, accumSec: (timer.accumSec || 0) + segSec, segStart: null, pauseStart: now });
  };

  const handleResume = () => {
    if (!timer || !timer.paused) return;
    const now = Date.now();
    const pauseStart = timer.pauseStart || now;
    const newLog = [...(timer.pauseLog || []), { start: pauseStart, end: now }];
    commitTimer({ ...timer, paused: false, segStart: now, pauseStart: 0, pauseLog: newLog });
  };

  const handleChangeCategory = (newCat) => {
    if (!timer || newCat === timer.taskCat) return;
    const now = Date.now();
    const closedSeg = { category: timer.taskCat, start: timer.categorySegStart || timer.startTime, end: now };
    commitTimer({ ...timer, taskCat: newCat, categoryLog: [...(timer.categoryLog || []), closedSeg], categorySegStart: now });
  };

  const handleAddMidMemo = () => {
    if (!timer || !midMemoText.trim()) return;
    const entry = { time: Date.now(), text: midMemoText.trim(), duringPause: timer.paused };
    commitTimer({ ...timer, midMemos: [...(timer.midMemos || []), entry] });
    setMidMemoText("");
  };

  const openStartTimeEdit = () => {
    if (!timer) return;
    setStartEditValue(fmtTime(timer.startTime));
    setEditingStart(true);
  };

  const saveStartTimeEdit = () => {
    const [h, m] = startEditValue.split(":").map((value) => parseInt(value, 10));
    if (Number.isNaN(h) || Number.isNaN(m) || !timer) {
      setEditingStart(false);
      return;
    }
    const now = Date.now();
    const newStart = new Date(timer.startTime);
    newStart.setHours(h, m, 0, 0);
    const newStartMs = newStart.getTime();
    if (newStartMs >= now) {
      setEditingStart(false);
      return;
    }
    const deltaSec = Math.floor((timer.startTime - newStartMs) / 1000);
    if (timer.paused) {
      commitTimer({ ...timer, startTime: newStartMs, accumSec: Math.max(0, (timer.accumSec || 0) + deltaSec) });
    } else {
      const newSegStart = timer.segStart ? timer.segStart - deltaSec * 1000 : newStartMs;
      commitTimer({ ...timer, startTime: newStartMs, segStart: newSegStart });
    }
    setEditingStart(false);
  };

  const buildSuggestedActual = (t) => (t.midMemos || []).filter((memo) => !memo.duringPause).map((memo) => memo.text).filter(Boolean).join(" + ");

  const openFinish = () => {
    if (!timer) return;
    setActualWorkDraft(buildSuggestedActual(timer));
    setFinishOpen(true);
  };

  const confirmFinish = () => {
    if (!timer) return;
    const now = Date.now();
    const segSec = !timer.paused && timer.segStart ? Math.floor((now - timer.segStart) / 1000) : 0;
    const duration = (timer.accumSec || 0) + segSec;
    let pauseLog = timer.pauseLog || [];
    if (timer.paused && timer.pauseStart) pauseLog = [...pauseLog, { start: timer.pauseStart, end: now }];
    const pauseSec = pauseLog.reduce((sum, p) => sum + Math.max(0, Math.floor((p.end - p.start) / 1000)), 0);
    const categoryLog = [...(timer.categoryLog || []), { category: timer.taskCat, start: timer.categorySegStart || timer.startTime, end: now }];

    if (duration >= 1) {
      const session = {
        id: makeId("worksession"),
        date: toDateKey(new Date(timer.startTime)),
        startTime: timer.startTime,
        endTime: now,
        duration,
        pauseSec,
        pauses: pauseLog,
        category: timer.taskCat,
        categoryLog,
        actualWork: actualWorkDraft.trim() || buildSuggestedActual(timer) || "미작성",
        memos: timer.midMemos || [],
        linkedTodoId: timer.linkedTodoId || null,
        linkedTodoTitle: timer.linkedTodoTitle || null
      };
      createWorkSession(session);
      if (timer.linkedTodoId) {
        updateTodo(timer.linkedTodoId, { lastWorkSessionAt: new Date().toISOString() });
      }
    }
    commitTimer(null);
    setFinishOpen(false);
    setActualWorkDraft("");
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    const next = [...categories, name];
    setCategories(next);
    saveTaskCategories(next);
    setNewCatName("");
  };

  const removeCategory = (name) => {
    if (categories.length <= 1) return;
    const next = categories.filter((item) => item !== name);
    setCategories(next);
    saveTaskCategories(next);
  };

  const running = !!timer;

  return (
    <GlassCard className="xl:sticky xl:top-5">
      <SectionTitle
        action={
          <button className="text-xs font-bold text-clover-sub underline decoration-dotted" onClick={() => setShowCategoryEditor((v) => !v)}>
            업무 유형 관리
          </button>
        }
      >
        타이머
      </SectionTitle>

      {showCategoryEditor && (
        <div className="mb-4 rounded-2xl bg-white/55 p-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                {cat}
                <button className="text-clover-danger" onClick={() => removeCategory(cat)}>×</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <AppInput value={newCatName} onChange={(event) => setNewCatName(event.target.value)} placeholder="새 유형 이름" />
            <AppButton variant="soft" onClick={addCategory}>추가</AppButton>
          </div>
        </div>
      )}

      {!running && (
        <div className="grid gap-3">
          <AppInput value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="지금 뭘 시작하나요? (선택)" />
          <AppButton className="w-full" onClick={handleStart}>▶ 작업 시작</AppButton>
        </div>
      )}

      {running && (
        <div className="grid gap-3">
          {timer.linkedTodoTitle && (
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-bold text-clover-deep">🔗 {timer.linkedTodoTitle}</p>
          )}

          <div className="rounded-[22px] bg-emerald-50 p-4 text-center">
            <p className="font-mono text-3xl font-black text-clover-deep">{fmtHMS(elapsedSec)}</p>
            {timer.paused && <p className="mt-1 text-sm font-bold text-amber-600">☕ 휴식 중 · {fmtHMS(pauseElapsedSec)}</p>}
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-clover-sub">
              {editingStart ? (
                <>
                  <input type="time" value={startEditValue} onChange={(event) => setStartEditValue(event.target.value)} className="rounded-lg border border-white/70 bg-white/80 px-2 py-1 text-xs" />
                  <button className="font-bold text-clover-deep" onClick={saveStartTimeEdit}>확인</button>
                </>
              ) : (
                <button onClick={openStartTimeEdit}>시작 {fmtTime(timer.startTime)} · 수정</button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleChangeCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${timer.taskCat === cat ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <AppInput value={midMemoText} onChange={(event) => setMidMemoText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleAddMidMemo()} placeholder="중간 메모를 남겨보세요" />
            <AppButton variant="soft" onClick={handleAddMidMemo}>기록</AppButton>
          </div>

          <div className="flex gap-2">
            <AppButton className="flex-1" variant={timer.paused ? "primary" : "soft"} onClick={timer.paused ? handleResume : handlePause}>
              {timer.paused ? "▶ 재개" : "☕ 휴식"}
            </AppButton>
            <AppButton className="flex-1" variant="danger" onClick={openFinish}>■ 종료</AppButton>
          </div>

          {!!(timer.midMemos || []).length && (
            <div className="grid gap-1.5 rounded-2xl bg-white/45 p-3">
              <p className="text-xs font-bold text-clover-sub">중간 메모 ({timer.midMemos.length})</p>
              {timer.midMemos.slice(-5).reverse().map((memo, index) => (
                <p key={index} className="text-xs text-clover-text">
                  <span className="mr-1 font-bold text-clover-sub">{fmtTime(memo.time)}</span>
                  {memo.duringPause && <span className="mr-1">☕</span>}
                  {memo.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {finishOpen && (
        <Modal title="오늘 뭘 했는지 한 줄로 남겨줄까요?" onClose={() => setFinishOpen(false)}>
          <div className="grid gap-3">
            <AppInput value={actualWorkDraft} onChange={(event) => setActualWorkDraft(event.target.value)} placeholder="실제로 한 업무를 적어주세요" autoFocus />
            <AppButton onClick={confirmFinish}>저장하고 종료</AppButton>
          </div>
        </Modal>
      )}
    </GlassCard>
  );
}

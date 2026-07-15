import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import { deleteWorkSession, inferWorkCategoryGroup, updateWorkSession } from "../../lib/storage/localStorageAdapter";
import { categoryColor, findOverlap, fmtClock, fmtHM } from "../../lib/utils/workUtils";

function toTimeInputValue(ms) {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function applyTimeToDate(ms, timeValue) {
  const [hour, minute] = timeValue.split(":").map(Number);
  const date = new Date(ms);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function groupCategories(categories = []) {
  return categories.reduce((map, category) => {
    const group = category.group || inferWorkCategoryGroup(category.name);
    map[group] = [...(map[group] || []), category];
    return map;
  }, {});
}

function getCategoryMeta(categories, name, fallbackGroup = "업무") {
  return categories.find((category) => category.name === name) || {
    id: `current-${name}`,
    group: fallbackGroup || inferWorkCategoryGroup(name),
    name,
    color: categoryColor(categories, name)
  };
}

export default function SessionCard({ session, categories = [], siblingSessions = [], readOnly = false, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [memoDraft, setMemoDraft] = useState("");
  const [error, setError] = useState("");
  const currentMeta = getCategoryMeta(categories, session.category, session.categoryGroup);
  const categoryOptions = categories.some((category) => category.name === session.category)
    ? categories
    : [currentMeta, ...categories];
  const grouped = useMemo(() => groupCategories(categoryOptions), [categoryOptions]);

  const startEdit = () => {
    setDraft({
      title: session.title,
      category: currentMeta.name,
      categoryGroup: currentMeta.group,
      start: toTimeInputValue(session.startTime),
      end: toTimeInputValue(session.endTime)
    });
    setError("");
    setEditing(true);
  };

  const save = () => {
    const selectedMeta = getCategoryMeta(categoryOptions, draft.category, draft.categoryGroup);
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
    updateWorkSession(session.id, {
      title: draft.title.trim() || session.title,
      category: selectedMeta.name,
      categoryGroup: selectedMeta.group,
      categoryLog: [{ category: selectedMeta.name, categoryGroup: selectedMeta.group, start: startTime, end: endTime }],
      startTime,
      endTime,
      duration
    });
    setEditing(false);
    onChange?.();
  };

  const remove = () => {
    deleteWorkSession(session.id);
    onChange?.();
  };

  const addMemo = () => {
    if (!memoDraft.trim()) return;
    updateWorkSession(session.id, {
      memos: [...(session.memos || []), { id: `memo-${Date.now()}`, text: memoDraft.trim(), phase: "note", time: Date.now() }]
    });
    setMemoDraft("");
    onChange?.();
  };

  return (
    <article className="rounded-2xl bg-white/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <AppInput value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          ) : (
            <p className="truncate text-sm font-black">{session.title}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: currentMeta.color }}>
              {currentMeta.group} · {session.category}
            </span>
            <span className="text-[11px] font-bold text-clover-sub">{fmtHM(session.duration)}</span>
            {session.pauseSec > 0 && <span className="text-[11px] text-clover-sub">휴식 {fmtHM(session.pauseSec)}</span>}
          </div>
        </div>

        {!readOnly && (
          <div className="flex shrink-0 gap-2">
            {editing ? (
              <>
                <AppButton className="min-h-8 px-3 py-1 text-xs" onClick={save}>저장</AppButton>
                <AppButton className="min-h-8 px-3 py-1 text-xs" variant="ghost" onClick={() => setEditing(false)}>취소</AppButton>
              </>
            ) : (
              <>
                <button className="text-xs font-bold text-clover-sub hover:text-clover-deep" onClick={startEdit}>수정</button>
                <button className="text-xs font-bold text-clover-sub hover:text-clover-danger" onClick={remove}>삭제</button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-[minmax(160px,1fr)_auto_auto_auto] sm:items-center">
          <AppSelect
            value={draft.category || ""}
            onChange={(event) => {
              const meta = getCategoryMeta(categoryOptions, event.target.value, draft.categoryGroup);
              setDraft((current) => ({ ...current, category: meta.name, categoryGroup: meta.group }));
            }}
          >
            {Object.entries(grouped).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((category) => (
                  <option key={category.id || `${group}-${category.name}`} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </AppSelect>
          <input
            type="time"
            value={draft.start}
            onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))}
            className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5"
          />
          <span className="text-clover-sub">~</span>
          <input
            type="time"
            value={draft.end}
            onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))}
            className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5"
          />
        </div>
      ) : (
        <p className="mt-2 text-xs font-bold text-clover-sub">{fmtClock(session.startTime)} ~ {fmtClock(session.endTime)}</p>
      )}
      {error && <p className="mt-2 text-xs font-bold text-clover-danger">{error}</p>}

      {!!session.memos?.length && (
        <div className="mt-3 grid gap-1">
          {session.memos.map((memo) => (
            <div key={memo.id} className="rounded-xl bg-white/50 px-3 py-1.5 text-xs text-clover-sub">
              <span className="mr-1 font-bold text-clover-deep">{memo.phase === "break" ? "휴식" : "메모"}</span>
              {memo.text}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <AppInput
            className="min-w-0 flex-1"
            placeholder="메모 추가"
            value={memoDraft}
            onChange={(event) => setMemoDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addMemo();
            }}
          />
          <AppButton className="shrink-0 whitespace-nowrap px-4" variant="soft" onClick={addMemo}>추가</AppButton>
        </div>
      )}
    </article>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppButton from "../../components/common/AppButton";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import PageHeader from "../../components/layout/PageHeader";
import TimeTracker from "../../components/work/TimeTracker";
import WorkLog from "../../components/work/WorkLog";
import WorkStats from "../../components/work/WorkStats";
import {
  getActiveSession,
  getAllData,
  getWorkCategories,
  saveAllData
} from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const WORK_TABS = [
  { label: "개요", to: "/work", active: true },
  { label: "할 일", to: "/tasks" },
  { label: "캘린더", to: "/calendar" },
  { label: "콘텐츠", to: "/content" },
  { label: "캠페인", to: "/campaigns" }
];

const memoId = () => `work-memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function WorkMemoPad({ today, onChange }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState(getAllData());

  const notes = useMemo(() => data.workMemos?.[today] || [], [data, today]);
  const openNotes = notes.filter((note) => !note.confirmed);
  const confirmedNotes = notes.filter((note) => note.confirmed);

  const refresh = () => {
    const next = getAllData();
    setData(next);
    onChange?.();
  };

  const commit = (recipe) => {
    const next = getAllData();
    next.workMemos = next.workMemos || {};
    next.workMemos[today] = next.workMemos[today] || [];
    recipe(next.workMemos[today]);
    saveAllData(next);
    refresh();
  };

  const saveMemo = () => {
    const text = draft.trim();
    if (!text) return;
    commit((list) => {
      if (editingId) {
        const target = list.find((note) => note.id === editingId);
        if (target) {
          target.text = text;
          target.updatedAt = new Date().toISOString();
        }
      } else {
        list.unshift({
          id: memoId(),
          text,
          confirmed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    setDraft("");
    setEditingId(null);
  };

  const editMemo = (note) => {
    setEditingId(note.id);
    setDraft(note.text);
  };

  const toggleConfirm = (noteId) => {
    commit((list) => {
      const target = list.find((note) => note.id === noteId);
      if (target) {
        target.confirmed = !target.confirmed;
        target.updatedAt = new Date().toISOString();
      }
    });
  };

  const deleteMemo = (noteId) => {
    commit((list) => {
      const index = list.findIndex((note) => note.id === noteId);
      if (index >= 0) list.splice(index, 1);
    });
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">메모장</h2>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              setEditingId(null);
            }}
            className="text-xs font-black text-clover-sub"
          >
            취소
          </button>
        )}
      </div>

      <div className="grid gap-3">
        <AppTextarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메모할 내용을 입력하세요. 여러 개를 하나씩 쌓아둘 수 있어요."
          className="min-h-[104px]"
        />
        <AppButton onClick={saveMemo} className="w-full">
          {editingId ? "메모 수정하기" : "메모 추가하기"}
        </AppButton>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-black">메모 목록 ({openNotes.length})</h3>
        <div className="grid gap-2">
          {openNotes.map((note) => (
            <div key={note.id} className="rounded-[22px] bg-white/60 p-4">
              <p className="whitespace-pre-wrap text-sm font-bold leading-6">{note.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleConfirm(note.id)} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  확인
                </button>
                <button onClick={() => editMemo(note)} className="rounded-full bg-white px-3 py-1 text-xs font-black text-clover-deep">
                  수정
                </button>
                <button onClick={() => deleteMemo(note.id)} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">
                  삭제
                </button>
              </div>
            </div>
          ))}
          {!openNotes.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">등록된 메모가 없어요.</p>}
        </div>
      </div>

      <details className="mt-4 rounded-[22px] bg-white/45 p-4">
        <summary className="cursor-pointer text-sm font-black text-clover-sub">확인된 메모 ({confirmedNotes.length})</summary>
        <div className="mt-3 grid gap-2">
          {confirmedNotes.map((note) => (
            <div key={note.id} className="rounded-2xl bg-white/55 p-3 text-sm font-bold text-clover-sub">
              <p className="whitespace-pre-wrap">{note.text}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => toggleConfirm(note.id)} className="text-xs font-black text-clover-deep">되돌리기</button>
                <button onClick={() => deleteMemo(note.id)} className="text-xs font-black text-rose-500">삭제</button>
              </div>
            </div>
          ))}
          {!confirmedNotes.length && <p className="text-sm font-bold text-clover-sub">아직 확인된 메모가 없어요.</p>}
        </div>
      </details>
    </GlassCard>
  );
}

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const categories = getWorkCategories();
  const activeSession = getActiveSession();
  const sessions = data.workSessions || [];

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실">
        <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>
          + 할 일 추가
        </AppButton>
      </PageHeader>

      <nav className="mb-5 flex gap-2 overflow-x-auto rounded-[28px] bg-white/55 p-2 shadow-glass">
        {WORK_TABS.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            className={`shrink-0 rounded-full px-5 py-3 text-sm font-black transition ${
              tab.active ? "bg-clover-deep text-white" : "text-clover-sub hover:bg-white/70"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
        <TimeTracker activeSession={activeSession} categories={categories} onChange={load} />
        <WorkStats sessions={sessions} categories={categories} today={today} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <WorkLog sessions={sessions} categories={categories} today={today} onChange={load} />
        <WorkMemoPad today={today} onChange={load} />
      </div>
    </>
  );
}

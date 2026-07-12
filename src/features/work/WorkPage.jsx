import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import SubPageTabs from "../../components/common/SubPageTabs";
import PageHeader from "../../components/layout/PageHeader";
import TimeTracker from "../../components/work/TimeTracker";
import WorkLog from "../../components/work/WorkLog";
import WorkStats from "../../components/work/WorkStats";
import { getActiveSession, getAllData, getWorkCategories, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const makeMemo = (text) => ({
  id: `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  text,
  status: "open",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const normalizeMemos = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [makeMemo(value.trim())];
  return [];
};

function WorkMemoPad({ today, onChange }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState("");
  const [items, setItems] = useState(() => normalizeMemos(getAllData().workMemos?.[today]));

  const saveItems = (nextItems) => {
    const data = getAllData();
    data.workMemos = { ...(data.workMemos || {}), [today]: nextItems };
    saveAllData(data);
    setItems(nextItems);
    onChange?.();
  };

  const addMemo = () => {
    if (!draft.trim()) return;
    if (editingId) {
      saveItems(items.map((item) => item.id === editingId ? { ...item, text: draft.trim(), updatedAt: new Date().toISOString() } : item));
      setEditingId("");
      setDraft("");
      return;
    }
    saveItems([makeMemo(draft.trim()), ...items]);
    setDraft("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft(item.text);
  };

  const confirmMemo = (id) => {
    saveItems(items.map((item) => item.id === id ? { ...item, status: "done", checkedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item));
  };

  const removeMemo = (id) => {
    saveItems(items.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId("");
      setDraft("");
    }
  };

  const openItems = items.filter((item) => item.status !== "done");
  const doneItems = items.filter((item) => item.status === "done");

  return (
    <GlassCard>
      <SectionTitle>메모장</SectionTitle>
      <div className="grid gap-3">
        <AppTextarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="메모할 내용을 입력하세요. 여러 개를 하나씩 쌓아둘 수 있어요." />
        <AppButton variant="soft" onClick={addMemo}>{editingId ? "메모 수정하기" : "메모 추가하기"}</AppButton>
        {editingId && <button type="button" className="text-left text-xs font-black text-clover-sub" onClick={() => { setEditingId(""); setDraft(""); }}>수정 취소</button>}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-black">메모 목록 ({openItems.length})</h3>
        <div className="grid gap-2">
          {openItems.map((item) => (
            <article key={item.id} className="rounded-2xl bg-white/60 p-3">
              <p className="whitespace-pre-wrap text-sm font-bold">{item.text}</p>
              <div className="mt-2 flex gap-2 text-xs font-black">
                <button type="button" className="text-clover-deep" onClick={() => confirmMemo(item.id)}>확인</button>
                <button type="button" className="text-clover-sub" onClick={() => startEdit(item)}>수정</button>
                <button type="button" className="text-red-500" onClick={() => removeMemo(item.id)}>삭제</button>
              </div>
            </article>
          ))}
          {!openItems.length && <p className="rounded-2xl bg-white/45 p-4 text-sm font-bold text-clover-sub">등록된 메모가 없어요.</p>}
        </div>
      </div>

      <details className="mt-4 rounded-2xl bg-white/45 p-3">
        <summary className="cursor-pointer text-sm font-black text-clover-sub">확인된 메모 ({doneItems.length})</summary>
        <div className="mt-3 grid gap-2">
          {doneItems.map((item) => (
            <article key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/55 px-3 py-2 text-sm">
              <p className="whitespace-pre-wrap text-clover-sub">{item.text}</p>
              <button type="button" className="shrink-0 text-xs font-black text-red-400" onClick={() => removeMemo(item.id)}>삭제</button>
            </article>
          ))}
          {!doneItems.length && <p className="text-sm font-bold text-clover-sub">확인된 메모가 아직 없어요.</p>}
        </div>
      </details>
    </GlassCard>
  );
}

export default function WorkPage() {
  const [data, setData] = useState(getAllData());
  const today = toDateKey(new Date());
  const categories = getWorkCategories();
  const activeSession = getActiveSession();

  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  return (
    <>
      <PageHeader eyebrow="WORK" title="업무 실행실">
        <AppButton onClick={() => window.dispatchEvent(new CustomEvent("clover-open-quick-add", { detail: "todo" }))}>+ 할 일 추가</AppButton>
      </PageHeader>

      <SubPageTabs
        items={[
          { key: "overview", label: "개요", active: true },
          { key: "tasks", label: "할 일", to: "/tasks" },
          { key: "calendar", label: "캘린더", to: "/calendar" },
          { key: "content", label: "콘텐츠", to: "/content" },
          { key: "campaigns", label: "캠페인", to: "/campaigns" }
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,.95fr)_minmax(0,1.05fr)]">
        <TimeTracker activeSession={activeSession} categories={categories} onEnded={load} />
        <WorkStats sessions={data.workSessions || []} categories={categories} today={today} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <WorkLog sessions={data.workSessions || []} categories={categories} today={today} onChange={load} />
        <WorkMemoPad today={today} onChange={load} />
      </div>
    </>
  );
}

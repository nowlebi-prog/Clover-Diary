import { useEffect, useState } from "react";
import GlassCard from "../../components/common/GlassCard";
import QuickMemoPad from "../../components/dashboard/QuickMemoPad";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";

export default function MemoPage() {
  const [data, setData] = useState(getAllData());
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const memos = data.inboxMemos || [];

  const toggleDone = (memo) => {
    const next = getAllData();
    next.inboxMemos = (next.inboxMemos || []).map((item) => item.id === memo.id ? { ...item, done: !item.done } : item);
    saveAllData(next);
    load();
  };

  const remove = (memo) => {
    const next = getAllData();
    next.inboxMemos = (next.inboxMemos || []).filter((item) => item.id !== memo.id);
    saveAllData(next);
    load();
  };

  return (
    <>
      <PageHeader eyebrow="LIFE" title="메모장" />
      <GlassCard className="mb-4">
        <QuickMemoPad memos={memos} />
      </GlassCard>
      <GlassCard>
        <div className="grid gap-2">
          {memos.map((memo) => (
            <div key={memo.id} className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${memo.done ? "bg-white/35 text-clover-sub line-through" : "bg-white/60"}`}>
              <p className="min-w-0 flex-1 whitespace-pre-wrap font-bold">{memo.body}</p>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => toggleDone(memo)} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black">{memo.done ? "되돌리기" : "완료"}</button>
                <button type="button" onClick={() => remove(memo)} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-500">삭제</button>
              </div>
            </div>
          ))}
          {!memos.length && <p className="rounded-2xl bg-white/40 p-4 text-center text-sm font-bold text-clover-sub">아직 메모가 없어요.</p>}
        </div>
      </GlassCard>
    </>
  );
}

import { useState } from "react";
import AppButton from "../common/AppButton";
import SectionTitle from "../common/SectionTitle";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";

export default function QuickMemoPad({ memos = [] }) {
  const [body, setBody] = useState("");
  const save = () => {
    if (!body.trim()) return;
    const date = new Date().toISOString().slice(0, 10);
    const data = getAllData();
    data.inboxMemos = [{ id: `memo-${Date.now()}`, body: body.trim(), done: false, createdAt: date, updatedAt: date }, ...(data.inboxMemos || [])];
    saveAllData(data);
    setBody("");
  };

  return (
    <div>
      <SectionTitle>빠른 메모</SectionTitle>
      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="생각나는 것 여기..."
          className="min-h-24 flex-1 rounded-[18px] border border-white/70 bg-[#FFFDF5]/75 p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-clover-primary"
          style={{ backgroundImage: "linear-gradient(transparent 94%, rgba(62,143,99,.13) 95%)", backgroundSize: "100% 24px" }}
        />
        <AppButton className="self-end px-4" onClick={save}>저장</AppButton>
      </div>
      <div className="mt-3 grid gap-1.5">
        {memos.slice(0, 2).map((memo) => <p key={memo.id} className="truncate rounded-2xl bg-white/45 px-3 py-2 text-xs">{memo.body}</p>)}
      </div>
    </div>
  );
}

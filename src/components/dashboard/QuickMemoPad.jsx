import { useState } from "react";
import { Link } from "react-router-dom";
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
      <SectionTitle action={<Link to="/archive"><AppButton variant="soft">Archive</AppButton></Link>}>Quick memo</SectionTitle>
      <p className="mb-3 text-sm text-clover-sub">Write it before it disappears.</p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Jot it down before it runs away."
        className="min-h-32 w-full rounded-[22px] border border-white/70 bg-white/55 p-4 text-sm leading-7 outline-none focus:ring-2 focus:ring-clover-primary"
        style={{ backgroundImage: "linear-gradient(transparent 95%, rgba(62,143,99,.14) 96%)", backgroundSize: "100% 28px" }}
      />
      <AppButton className="mt-3 w-full" onClick={save}>Save memo</AppButton>
      <div className="mt-4 grid gap-2">
        {memos.slice(0, 3).map((memo) => <p key={memo.id} className="rounded-2xl bg-white/50 p-3 text-sm">{memo.body}</p>)}
      </div>
    </div>
  );
}

import { useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import Modal from "../common/Modal";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const options = [
  ["todo", "Todo"],
  ["event", "Event"],
  ["memo", "Quick memo"],
  ["shoppingItems", "Shopping item"],
  ["expenses", "Expense"],
  ["payments", "Payment plan"],
  ["contentPlans", "Content plan"],
  ["campaigns", "Campaign"],
  ["importantFiles", "Important file"]
];

const defaults = (type) => {
  const today = toDateKey(new Date());
  const base = { title: "", memo: "" };
  const map = {
    todo: { title: "", dueDate: today, priority: "normal", category: "개인", completed: false },
    event: { title: "", date: today, time: "09:00", category: "개인", memo: "" },
    memo: { body: "" },
    shoppingItems: { title: "", category: "장보기", memo: "", completed: false },
    expenses: { title: "", amount: "", date: today, category: "생활", memo: "" },
    payments: { project: "", client: "", amount: "", status: "미입금", expectedDate: today, paidDate: "", memo: "" },
    contentPlans: { title: "", channel: "인스타", publishDate: today, status: "아이디어", memo: "", link: "" },
    campaigns: { name: "", brand: "", product: "", applyDueDate: today, uploadDueDate: today, status: "모집중", memo: "" },
    importantFiles: { name: "", category: "참고자료", url: "", project: "", important: true, memo: "" }
  };
  return map[type] || base;
};

const collectionFor = (type) => ({ todo: "todos", event: "events", memo: "inboxMemos" }[type] || type);

export default function QuickAddModal({ open, initialType = "todo", onClose }) {
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(defaults(initialType));
  if (!open) return null;

  const changeType = (next) => {
    setType(next);
    setForm(defaults(next));
  };
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const save = () => {
    const data = getAllData();
    const collection = collectionFor(type);
    const date = toDateKey(new Date());
    const payload = type === "memo" ? { ...form, body: form.body || form.title, done: false } : form;
    data[collection] = [{ id: `${collection}-${Date.now()}`, createdAt: date, updatedAt: date, ...payload }, ...(data[collection] || [])];
    saveAllData(data);
    onClose();
  };

  return (
    <Modal title="Quick add" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">What do you want to add?
          <AppSelect value={type} onChange={(event) => changeType(event.target.value)}>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </AppSelect>
        </label>

        {type === "todo" && (
          <>
            <label className="grid gap-1 text-sm font-bold">Title<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">Due date<AppInput type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}
        {type === "event" && (
          <>
            <label className="grid gap-1 text-sm font-bold">Title<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">Date<AppInput type="date" value={form.date} onChange={(event) => set("date", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">Time<AppInput type="time" value={form.time} onChange={(event) => set("time", event.target.value)} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}
        {type === "memo" && <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={form.body || ""} onChange={(event) => set("body", event.target.value)} /></label>}
        {["shoppingItems", "expenses", "payments", "contentPlans", "campaigns", "importantFiles"].includes(type) && (
          <>
            <label className="grid gap-1 text-sm font-bold">Name<AppInput value={form.title || form.project || form.name || ""} onChange={(event) => set(type === "payments" ? "project" : type === "campaigns" || type === "importantFiles" ? "name" : "title", event.target.value)} /></label>
            {"amount" in form && <label className="grid gap-1 text-sm font-bold">Amount<AppInput type="number" value={form.amount} onChange={(event) => set("amount", event.target.value)} /></label>}
            <label className="grid gap-1 text-sm font-bold">Date<AppInput type="date" value={form.date || form.expectedDate || form.publishDate || form.applyDueDate || ""} onChange={(event) => set(type === "payments" ? "expectedDate" : type === "contentPlans" ? "publishDate" : type === "campaigns" ? "applyDueDate" : "date", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">Memo<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}
        <AppButton onClick={save}>Save</AppButton>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import Modal from "../common/Modal";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const options = [
  ["todo", "할 일 추가"],
  ["event", "일정 추가"],
  ["memo", "메모 추가"],
  ["shoppingItems", "구매 항목 추가"]
];

const defaults = (type) => {
  const today = toDateKey(new Date());
  const map = {
    todo: { title: "", dueDate: today, priority: "normal", category: "개인", completed: false, memo: "" },
    event: { title: "", date: today, time: "09:00", category: "개인", memo: "" },
    memo: { body: "" },
    shoppingItems: { title: "", category: "장보기", memo: "", completed: false }
  };
  return map[type] || map.todo;
};

const collectionFor = (type) => ({ todo: "todos", event: "events", memo: "inboxMemos" }[type] || type);

export default function QuickAddModal({ open, initialType = "todo", onClose }) {
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(defaults(initialType));

  const changeType = (next) => {
    setType(next);
    setForm(defaults(next));
  };

  useEffect(() => {
    if (open) changeType(initialType);
  }, [open, initialType]);

  if (!open) return null;

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
    <Modal title="빠른 추가" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">추가할 항목
          <AppSelect value={type} onChange={(event) => changeType(event.target.value)}>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </AppSelect>
        </label>

        {type === "todo" && (
          <>
            <label className="grid gap-1 text-sm font-bold">할 일<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">마감일<AppInput type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "event" && (
          <>
            <label className="grid gap-1 text-sm font-bold">일정<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.date} onChange={(event) => set("date", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">시간<AppInput type="time" value={form.time} onChange={(event) => set("time", event.target.value)} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "memo" && (
          <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.body || ""} onChange={(event) => set("body", event.target.value)} /></label>
        )}

        {type === "shoppingItems" && (
          <>
            <label className="grid gap-1 text-sm font-bold">구매 항목<AppInput value={form.title || ""} onChange={(event) => set("title", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        <AppButton onClick={save}>저장</AppButton>
      </div>
    </Modal>
  );
}

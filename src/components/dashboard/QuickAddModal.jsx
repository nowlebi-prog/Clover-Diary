import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import Modal from "../common/Modal";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";

const options = [
  ["todo", "할 일"],
  ["event", "일정"],
  ["payment", "수입"],
  ["expense", "지출"],
  ["memo", "메모"],
  ["shoppingItems", "구매 항목"]
];

const baseCategories = ["개인", "업무", "집안일", "콘텐츠", "건강", "돈관리", "정리", "기타"];
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaults = (type) => {
  const today = toDateKey(new Date());
  const map = {
    todo: { title: "", dueDate: today, allDay: false, startTime: "", endTime: "", dueTime: "", priority: "normal", category: "개인", completed: false, subTasks: [], memo: "" },
    event: { title: "", date: today, allDay: false, time: "09:00", endTime: "", category: "개인", memo: "" },
    payment: { project: "", client: "", amount: "", category: "유별난", status: "입금 예정", expectedDate: today, memo: "" },
    expense: { title: "", amount: "", date: today, category: "식비", memo: "" },
    memo: { body: "" },
    shoppingItems: { title: "", category: "생활", memo: "", completed: false }
  };
  return map[type] || map.todo;
};

const collectionFor = (type) => ({ todo: "todos", event: "events", memo: "inboxMemos", payment: "payments", expense: "expenses" }[type] || type);
const subTaskText = (todo) => (todo.subTasks || []).map((item) => item.title).join("\n");
const parseAmount = (text) => Number(String(text).replace(/[^0-9]/g, "")) || "";

const parseSubTasks = (text, existing = []) =>
  text.split("\n").map((line) => line.trim()).filter(Boolean).map((title, index) => ({
    id: existing[index]?.id || `sub-${Date.now()}-${index}`,
    title,
    completed: Boolean(existing[index]?.completed)
  }));

function guessType(text) {
  const value = text.trim();
  if (!value) return null;
  if (/입금|수입|받음|계약금|잔금|세금계산서/.test(value)) return "payment";
  if (/지출|결제|구매|샀|커피|식비|교통|월세|보험|관리비/.test(value)) return "expense";
  if (/메모|아이디어|기억|나중에/.test(value)) return "memo";
  return "todo";
}

export default function QuickAddModal({ open, initialType = "todo", onClose }) {
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(defaults(initialType));
  const [quickText, setQuickText] = useState("");

  const data = useMemo(() => getAllData(), [open]);
  const categories = useMemo(() => {
    const fromTodos = (data.todos || []).map((todo) => todo.category || todo.project).filter(Boolean);
    return [...new Set([...baseCategories, ...fromTodos])];
  }, [data.todos]);
  const guessedType = guessType(quickText);

  const changeType = (next, seed = quickText) => {
    const nextForm = defaults(next);
    const amount = parseAmount(seed);
    if (next === "todo") nextForm.title = seed;
    if (next === "event") nextForm.title = seed;
    if (next === "memo") nextForm.body = seed;
    if (next === "payment") {
      nextForm.project = seed.replace(/[0-9,원\s]+/g, " ").trim();
      nextForm.amount = amount;
    }
    if (next === "expense") {
      nextForm.title = seed.replace(/[0-9,원\s]+/g, " ").trim();
      nextForm.amount = amount;
    }
    if (next === "shoppingItems") nextForm.title = seed;
    setType(next);
    setForm(nextForm);
  };

  useEffect(() => {
    if (open) {
      setQuickText("");
      changeType(initialType, "");
    }
  }, [open, initialType]);

  if (!open) return null;

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const save = () => {
    const allData = getAllData();
    const collection = collectionFor(type);
    const date = toDateKey(new Date());
    const category = (form.category || "개인").trim();
    const payload =
      type === "memo" ? { ...form, body: form.body || quickText, done: false }
      : type === "todo" ? { ...form, category, project: category, projectName: category, dueTime: form.allDay ? "" : form.startTime || form.dueTime || "", startTime: form.allDay ? "" : form.startTime || form.dueTime || "", endTime: form.allDay ? "" : form.endTime || "" }
      : form;
    allData[collection] = [{ id: makeId(collection), createdAt: date, updatedAt: date, ...payload }, ...(allData[collection] || [])];
    saveAllData(allData);
    onClose();
  };

  return (
    <Modal title="빠른 추가" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">
          빠른 문장 입력
          <AppInput value={quickText} onChange={(event) => setQuickText(event.target.value)} placeholder="예: 인스타 견적서 보내기 / A클라이언트 입금 500000원" autoFocus />
        </label>

        {quickText.trim() && guessedType && (
          <div className="rounded-[22px] bg-white/55 p-3">
            <p className="mb-2 text-sm font-bold text-clover-sub">자동 분류해볼까요?</p>
            <div className="flex flex-wrap gap-2">
              <AppButton variant={guessedType === "todo" ? "primary" : "soft"} onClick={() => changeType("todo")}>To do에 추가할까요?</AppButton>
              <AppButton variant={guessedType === "payment" ? "primary" : "soft"} onClick={() => changeType("payment")}>수입에 추가할까요?</AppButton>
              <AppButton variant={guessedType === "expense" ? "primary" : "soft"} onClick={() => changeType("expense")}>지출에 추가할까요?</AppButton>
              <AppButton variant={guessedType === "memo" ? "primary" : "soft"} onClick={() => changeType("memo")}>메모에 추가할까요?</AppButton>
            </div>
          </div>
        )}

        <label className="grid gap-1 text-sm font-bold">
          추가할 항목
          <AppSelect value={type} onChange={(event) => changeType(event.target.value)}>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </AppSelect>
        </label>

        {type === "todo" && (
          <>
            <label className="grid gap-1 text-sm font-bold">할 일<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <label className="grid gap-1 text-sm font-bold">하위 목록<AppTextarea value={subTaskText(form)} onChange={(event) => set("subTasks", parseSubTasks(event.target.value, form.subTasks || []))} placeholder={"하위 작업을 한 줄에 하나씩 추가할 수 있어요."} /></label>
            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">시작<AppInput type="time" value={form.startTime || ""} disabled={form.allDay} onChange={(event) => { set("startTime", event.target.value); set("dueTime", event.target.value); }} /></label>
              <label className="grid gap-1 text-sm font-bold">종료<AppInput type="time" value={form.endTime || ""} disabled={form.allDay} onChange={(event) => set("endTime", event.target.value)} /></label>
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">하루종일<input type="checkbox" checked={Boolean(form.allDay)} onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked, startTime: "", endTime: "", dueTime: "" }))} /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">중요도<AppSelect value={form.priority || "normal"} onChange={(event) => set("priority", event.target.value)}><option value="high">매우 중요</option><option value="normal">보통</option><option value="low">가벼움</option></AppSelect></label>
              <label className="grid gap-1 text-sm font-bold">분류<AppInput list="quick-todo-category-list" value={form.category || ""} onChange={(event) => set("category", event.target.value)} /><datalist id="quick-todo-category-list">{categories.map((item) => <option key={item} value={item} />)}</datalist></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "event" && (
          <>
            <label className="grid gap-1 text-sm font-bold">일정<AppInput value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.date} onChange={(event) => set("date", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">시작<AppInput type="time" value={form.time || ""} disabled={form.allDay} onChange={(event) => set("time", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">종료<AppInput type="time" value={form.endTime || ""} disabled={form.allDay} onChange={(event) => set("endTime", event.target.value)} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "payment" && (
          <>
            <label className="grid gap-1 text-sm font-bold">수입명 / 프로젝트<AppInput value={form.project || ""} onChange={(event) => set("project", event.target.value)} /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">금액<AppInput type="number" value={form.amount || ""} onChange={(event) => set("amount", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">예정일<AppInput type="date" value={form.expectedDate || ""} onChange={(event) => set("expectedDate", event.target.value)} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "expense" && (
          <>
            <label className="grid gap-1 text-sm font-bold">지출 항목<AppInput value={form.title || ""} onChange={(event) => set("title", event.target.value)} /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">금액<AppInput type="number" value={form.amount || ""} onChange={(event) => set("amount", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.date || ""} onChange={(event) => set("date", event.target.value)} /></label>
            </div>
            <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} /></label>
          </>
        )}

        {type === "memo" && <label className="grid gap-1 text-sm font-bold">메모<AppTextarea value={form.body || ""} onChange={(event) => set("body", event.target.value)} /></label>}
        {type === "shoppingItems" && <label className="grid gap-1 text-sm font-bold">구매 항목<AppInput value={form.title || ""} onChange={(event) => set("title", event.target.value)} /></label>}

        <AppButton onClick={save}>저장</AppButton>
      </div>
    </Modal>
  );
}

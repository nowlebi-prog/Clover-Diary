import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import AppTextarea from "../common/AppTextarea";
import TimeField from "../common/TimeField";
import Modal from "../common/Modal";
import SubTaskEditor, { cleanSubTasks } from "../tasks/SubTaskEditor";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { addDays, toDateKey } from "../../lib/utils/date";

const options = [
  ["todo", "할 일"],
  ["event", "일정"],
  ["payment", "수입"],
  ["expense", "지출"],
  ["memo", "메모"],
  ["shoppingItems", "구매 항목"]
];

const baseCategories = ["개인", "업무", "스터디", "집안일", "콘텐츠", "건강", "돈관리", "정리", "기타"];
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaults = (type) => {
  const today = toDateKey(new Date());
  const map = {
    todo: { title: "", dueDate: today, allDay: false, startTime: "", endTime: "", endDate: "", dueTime: "", priority: "normal", category: "개인", completed: false, subTasks: [], memo: "" },
    event: { title: "", date: today, allDay: false, time: "09:00", endTime: "", category: "개인", memo: "" },
    payment: { project: "", client: "", amount: "", category: "자유소득", status: "입금 예정", expectedDate: today, memo: "" },
    expense: { title: "", amount: "", date: today, category: "생활비", memo: "" },
    memo: { body: "" },
    shoppingItems: { title: "", category: "생활", memo: "", completed: false, importance: 3 }
  };
  return map[type] || map.todo;
};

const collectionFor = (type) => ({ todo: "todos", event: "events", memo: "inboxMemos", payment: "payments", expense: "expenses" }[type] || type);
const parseAmount = (text) => Number(String(text).replace(/[^0-9]/g, "")) || "";

function guessType(text) {
  const value = text.trim();
  if (!value) return null;
  if (/입금|수입|받음|계약금|잔금|세금계산서/.test(value)) return "payment";
  if (/지출|결제|구매|샀|커피|생활비|교통|월세|보험|관리비/.test(value)) return "expense";
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
      nextForm.project = seed.replace(/[0-9,\s원]+/g, " ").trim();
      nextForm.amount = amount;
    }
    if (next === "expense") {
      nextForm.title = seed.replace(/[0-9,\s원]+/g, " ").trim();
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
      : type === "todo" ? { ...form, subTasks: cleanSubTasks(form.subTasks), category, project: category, projectName: category, dueTime: form.allDay ? "" : form.startTime || form.dueTime || "", startTime: form.allDay ? "" : form.startTime || form.dueTime || "", endTime: form.allDay ? "" : form.endTime || "" }
      : form;
    allData[collection] = [{ id: makeId(collection), createdAt: date, updatedAt: date, ...payload }, ...(allData[collection] || [])];
    saveAllData(allData);
    onClose();
  };

  return (
    <Modal title="빠른 추가" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">
          자연어로 먼저 적기
          <AppInput value={quickText} onChange={(event) => setQuickText(event.target.value)} placeholder="예: 인스타 견적서 보내기 / 커피 4500원 / A 클라이언트 입금 500000원" autoFocus />
        </label>

        {quickText.trim() && guessedType && (
          <div className="rounded-[22px] bg-white/55 p-3">
            <p className="mb-2 text-sm font-bold text-clover-sub">이렇게 분류할까요?</p>
            <div className="flex flex-wrap gap-2">
              <AppButton variant={guessedType === "todo" ? "primary" : "soft"} onClick={() => changeType("todo")}>To do에 추가</AppButton>
              <AppButton variant={guessedType === "payment" ? "primary" : "soft"} onClick={() => changeType("payment")}>수입에 추가</AppButton>
              <AppButton variant={guessedType === "expense" ? "primary" : "soft"} onClick={() => changeType("expense")}>지출에 추가</AppButton>
              <AppButton variant={guessedType === "memo" ? "primary" : "soft"} onClick={() => changeType("memo")}>메모에 추가</AppButton>
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
            <SubTaskEditor value={form.subTasks || []} onChange={(subTasks) => set("subTasks", subTasks)} />
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="grid gap-1 text-sm font-bold">날짜<AppInput type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></label>
              <label className="grid gap-1 text-sm font-bold">시작<TimeField value={form.startTime || ""} disabled={form.allDay} onChange={(value) => { set("startTime", value); set("dueTime", value); }} /></label>
              <label className="grid gap-1 text-sm font-bold">종료<TimeField value={form.endTime || ""} disabled={form.allDay} onChange={(value) => set("endTime", value)} /></label>
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">다음날로 종료<input type="checkbox" disabled={form.allDay} checked={Boolean(form.endDate && form.endDate !== form.dueDate)} onChange={(event) => set("endDate", event.target.checked ? addDays(form.dueDate || toDateKey(new Date()), 1) : "")} /></label>
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">하루종일<input type="checkbox" checked={Boolean(form.allDay)} onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked, startTime: "", endTime: "", endDate: "", dueTime: "" }))} /></label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">중요도<AppSelect value={form.priority || "normal"} onChange={(event) => set("priority", event.target.value)}><option value="high">매우 중요</option><option value="normal">보통</option><option value="low">가벼움</option></AppSelect></label>
              <label className="grid gap-1 text-sm font-bold">분류<AppSelect value={form.category || "개인"} onChange={(event) => set("category", event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</AppSelect></label>
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
            <label className="flex items-center justify-between rounded-2xl bg-rose-50/70 px-4 py-3 text-sm font-bold text-rose-700">
              갭이어 업로드 필요
              <input
                type="checkbox"
                checked={Boolean(form.gapYearUploadRequired || form.gapYearRegistered)}
                onChange={(event) => {
                  set("gapYearUploadRequired", event.target.checked);
                  if (!event.target.checked) set("gapYearRegistered", false);
                }}
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm font-bold text-emerald-700">
              갭이어 업로드 완료
              <input
                type="checkbox"
                checked={Boolean(form.gapYearRegistered)}
                onChange={(event) => {
                  set("gapYearRegistered", event.target.checked);
                  if (event.target.checked) set("gapYearUploadRequired", true);
                }}
              />
            </label>
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

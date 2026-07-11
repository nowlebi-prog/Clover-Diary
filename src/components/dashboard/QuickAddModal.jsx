import { useEffect, useMemo, useState } from "react";
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

const baseCategories = ["개인", "업무", "집안일", "콘텐츠", "건강", "돈관리", "정리", "기타"];

const defaults = (type) => {
  const today = toDateKey(new Date());
  const map = {
    todo: {
      title: "",
      dueDate: today,
      allDay: false,
      startTime: "",
      endTime: "",
      dueTime: "",
      priority: "normal",
      category: "개인",
      project: "개인",
      projectName: "개인",
      completed: false,
      subTasks: [],
      memo: ""
    },
    event: { title: "", date: today, allDay: false, time: "09:00", endTime: "", category: "개인", memo: "" },
    memo: { body: "" },
    shoppingItems: { title: "", category: "생활", memo: "", completed: false }
  };
  return map[type] || map.todo;
};

const collectionFor = (type) => ({ todo: "todos", event: "events", memo: "inboxMemos" }[type] || type);

const subTaskText = (todo) => (todo.subTasks || []).map((item) => item.title).join("\n");

const parseSubTasks = (text, existing = []) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title, index) => ({
      id: existing[index]?.id || `sub-${Date.now()}-${index}`,
      title,
      completed: Boolean(existing[index]?.completed)
    }));

export default function QuickAddModal({ open, initialType = "todo", onClose }) {
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(defaults(initialType));

  const data = useMemo(() => getAllData(), [open]);
  const categories = useMemo(() => {
    const fromTodos = (data.todos || []).map((todo) => todo.category || todo.project).filter(Boolean);
    return [...new Set([...baseCategories, ...fromTodos])];
  }, [data.todos]);

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
    const allData = getAllData();
    const collection = collectionFor(type);
    const date = toDateKey(new Date());
    const category = (form.category || "개인").trim();
    const payload =
      type === "memo"
        ? { ...form, body: form.body || form.title, done: false }
        : type === "todo"
          ? {
              ...form,
              category,
              project: category,
              projectName: category,
              dueTime: form.allDay ? "" : form.startTime || form.dueTime || "",
              startTime: form.allDay ? "" : form.startTime || form.dueTime || "",
              endTime: form.allDay ? "" : form.endTime || ""
            }
          : form;
    allData[collection] = [{ id: `${collection}-${Date.now()}`, createdAt: date, updatedAt: date, ...payload }, ...(allData[collection] || [])];
    saveAllData(allData);
    onClose();
  };

  return (
    <Modal title="빠른 추가" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-bold">
          추가할 항목
          <AppSelect value={type} onChange={(event) => changeType(event.target.value)}>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </AppSelect>
        </label>

        {type === "todo" && (
          <>
            <label className="grid gap-1 text-sm font-bold">
              할 일
              <AppInput value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="바로 처리할 일을 적어주세요." autoFocus />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              하위 목록
              <AppTextarea
                value={subTaskText(form)}
                onChange={(event) => set("subTasks", parseSubTasks(event.target.value, form.subTasks || []))}
                placeholder={"하위 작업을 한 줄에 하나씩 추가할 수 있어요.\n예: 자료 확인\n예: 전달 메시지 작성"}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-[1fr_120px_120px]">
              <label className="grid gap-1 text-sm font-bold">
                날짜
                <AppInput type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                시작
                <AppInput type="time" value={form.startTime || ""} disabled={form.allDay} onChange={(event) => { set("startTime", event.target.value); set("dueTime", event.target.value); }} />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                종료
                <AppInput type="time" value={form.endTime || ""} disabled={form.allDay} onChange={(event) => set("endTime", event.target.value)} />
              </label>
            </div>
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
              하루종일
              <input type="checkbox" checked={Boolean(form.allDay)} onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked, startTime: "", endTime: "", dueTime: "" }))} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                중요도
                <AppSelect value={form.priority || "normal"} onChange={(event) => set("priority", event.target.value)}>
                  <option value="high">매우 중요</option>
                  <option value="normal">보통</option>
                  <option value="low">가벼움</option>
                </AppSelect>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                분류
                <AppInput list="quick-todo-category-list" value={form.category || ""} onChange={(event) => set("category", event.target.value)} placeholder="직접 입력하거나 선택" />
                <datalist id="quick-todo-category-list">
                  {categories.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              메모
              <AppTextarea value={form.memo || ""} onChange={(event) => set("memo", event.target.value)} />
            </label>
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
            <label className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-sm font-bold">
              하루종일
              <input type="checkbox" checked={Boolean(form.allDay)} onChange={(event) => setForm((current) => ({ ...current, allDay: event.target.checked, time: "", endTime: "" }))} />
            </label>
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

import AppInput from "../common/AppInput";

const makeSubTask = () => ({
  id: `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: "",
  completed: false
});

export const cleanSubTasks = (subTasks = []) =>
  subTasks
    .map((item) => ({
      ...item,
      title: (item.title || "").trim(),
      completed: Boolean(item.completed)
    }))
    .filter((item) => item.title);

export default function SubTaskEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const setItems = (nextItems) => onChange(nextItems);

  const addItem = (index = items.length) => {
    setItems([...items.slice(0, index), makeSubTask(), ...items.slice(index)]);
  };

  const updateItem = (id, updates) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">하위 목록</span>
        <button
          type="button"
          onClick={() => addItem()}
          className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold text-clover-deep shadow-sm transition hover:bg-white"
        >
          + 추가
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => addItem()}
          className="rounded-2xl border border-dashed border-clover-line bg-white/45 px-4 py-4 text-left text-sm font-semibold text-clover-sub transition hover:bg-white/70"
        >
          하위 작업을 한 칸씩 추가해보세요.
        </button>
      ) : (
        <div className="grid gap-2">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-2xl bg-white/55 p-2">
              <input
                type="checkbox"
                checked={Boolean(item.completed)}
                onChange={(event) => updateItem(item.id, { completed: event.target.checked })}
                className="h-4 w-4 accent-clover-deep"
                aria-label={`${index + 1}번째 하위 목록 완료`}
              />
              <AppInput
                value={item.title || ""}
                onChange={(event) => updateItem(item.id, { title: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addItem(index + 1);
                  }
                }}
                placeholder={`${index + 1}. 하위 작업`}
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-full px-3 py-2 text-xs font-bold text-clover-sub transition hover:bg-white/75 hover:text-clover-deep"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

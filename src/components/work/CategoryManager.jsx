import { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import AppSelect from "../common/AppSelect";
import GlassCard from "../common/GlassCard";
import { createWorkCategory, deleteWorkCategory, updateWorkCategory, WORK_CATEGORY_GROUPS } from "../../lib/storage/localStorageAdapter";

const fallbackGroup = WORK_CATEGORY_GROUPS[0]?.name || "업무";

export default function CategoryManager({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState(fallbackGroup);
  const [color, setColor] = useState(WORK_CATEGORY_GROUPS[0]?.colors?.[0] || "#8DDFA8");
  const [drafts, setDrafts] = useState({});

  const grouped = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      const groupName = cat.group || fallbackGroup;
      map[groupName] = [...(map[groupName] || []), cat];
    });
    return map;
  }, [categories]);

  const activePalette = useMemo(
    () => WORK_CATEGORY_GROUPS.find((item) => item.name === group)?.colors || WORK_CATEGORY_GROUPS[0]?.colors || ["#8DDFA8"],
    [group]
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(categories.map((cat) => [cat.id, { group: cat.group || fallbackGroup, name: cat.name, color: cat.color }])));
  }, [categories]);

  useEffect(() => {
    if (!activePalette.includes(color)) setColor(activePalette[0]);
  }, [activePalette, color]);

  const saveCategory = (cat) => {
    const draft = drafts[cat.id] || {};
    const nextName = String(draft.name || "").trim();
    const nextGroup = draft.group || cat.group || fallbackGroup;
    const nextColor = draft.color || cat.color;
    if (!nextName) return;
    if (nextName === cat.name && nextGroup === cat.group && nextColor === cat.color) return;
    updateWorkCategory(cat.id, { name: nextName, group: nextGroup, color: nextColor });
  };

  const addCategory = () => {
    if (!name.trim()) return;
    createWorkCategory({ name: name.trim(), group, color });
    setName("");
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black">업무 카테고리</h2>
        <button className="text-xs font-bold text-clover-sub underline" onClick={() => setOpen((value) => !value)}>
          {open ? "닫기" : "관리"}
        </button>
      </div>

      <div className="grid gap-2">
        {Object.entries(grouped).map(([groupName, list]) => (
          <div key={groupName} className="rounded-2xl bg-white/45 p-2">
            <p className="mb-1 px-1 text-[11px] font-black text-clover-sub">{groupName}</p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((cat) => (
                <span key={cat.id} className="rounded-full px-3 py-1.5 text-xs font-bold text-clover-ink" style={{ background: cat.color }}>
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-4 grid gap-3">
          {categories.map((cat) => {
            const draft = drafts[cat.id] || { group: cat.group || fallbackGroup, name: cat.name, color: cat.color };
            const palette = WORK_CATEGORY_GROUPS.find((item) => item.name === draft.group)?.colors || activePalette;
            return (
              <div key={cat.id} className="grid gap-2 rounded-2xl bg-white/45 p-3">
                <div className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)_auto_auto] md:items-center">
                  <AppSelect
                    value={draft.group}
                    onChange={(event) => {
                      const nextPalette = WORK_CATEGORY_GROUPS.find((item) => item.name === event.target.value)?.colors || palette;
                      setDrafts((current) => ({ ...current, [cat.id]: { ...draft, group: event.target.value, color: nextPalette[0] } }));
                    }}
                  >
                    {WORK_CATEGORY_GROUPS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </AppSelect>
                  <AppInput
                    value={draft.name}
                    onChange={(event) => setDrafts((current) => ({ ...current, [cat.id]: { ...draft, name: event.target.value } }))}
                    onBlur={() => saveCategory(cat)}
                  />
                  <button className="shrink-0 text-xs font-bold text-clover-deep" onClick={() => saveCategory(cat)}>저장</button>
                  <button className="shrink-0 text-xs font-bold text-clover-sub hover:text-clover-danger" onClick={() => deleteWorkCategory(cat.id)}>삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {palette.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setDrafts((current) => ({ ...current, [cat.id]: { ...draft, color: swatch } }))}
                      className={`h-6 w-6 rounded-full transition ${draft.color === swatch ? "ring-2 ring-clover-deep ring-offset-2" : ""}`}
                      style={{ background: swatch }}
                      aria-label={`${cat.name} color ${swatch}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-2 grid gap-3 rounded-2xl bg-white/50 p-3">
            <div className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)]">
              <AppSelect value={group} onChange={(event) => setGroup(event.target.value)}>
                {WORK_CATEGORY_GROUPS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </AppSelect>
              <AppInput placeholder="세부 카테고리 이름" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {activePalette.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={`h-7 w-7 rounded-full transition ${color === swatch ? "ring-2 ring-clover-deep ring-offset-2" : ""}`}
                  style={{ background: swatch }}
                  aria-label={`new category color ${swatch}`}
                />
              ))}
            </div>
            <AppButton className="min-h-9 px-4 py-1 text-xs" onClick={addCategory} disabled={!name.trim()}>
              세부 카테고리 추가
            </AppButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

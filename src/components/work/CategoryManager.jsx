import { useState } from "react";
import AppButton from "../common/AppButton";
import AppInput from "../common/AppInput";
import GlassCard from "../common/GlassCard";
import { createWorkCategory, updateWorkCategory, deleteWorkCategory } from "../../lib/storage/localStorageAdapter";

const PALETTE = ["#60A5FA", "#8DDFA8", "#F6C68D", "#C9A9FA", "#F4B6D2", "#FFDCD1", "#BFEFE0", "#F6A6A6"];

export default function CategoryManager({ categories = [] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black">업무 카테고리</h2>
        <button className="text-xs font-bold text-clover-sub underline" onClick={() => setOpen((v) => !v)}>
          {open ? "닫기" : "관리"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span key={cat.id} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: cat.color }}>
            {cat.name}
          </span>
        ))}
      </div>

      {open && (
        <div className="mt-4 grid gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: cat.color }} />
              <AppInput
                value={cat.name}
                onChange={(event) => updateWorkCategory(cat.id, { name: event.target.value })}
              />
              <button className="shrink-0 text-xs font-bold text-clover-sub hover:text-clover-danger" onClick={() => deleteWorkCategory(cat.id)}>
                삭제
              </button>
            </div>
          ))}

          <div className="mt-2 grid gap-2 rounded-2xl bg-white/50 p-3">
            <AppInput placeholder="새 카테고리 이름" value={name} onChange={(event) => setName(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition ${color === c ? "ring-2 ring-clover-deep ring-offset-2" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <AppButton
              className="min-h-9 px-4 py-1 text-xs"
              onClick={() => {
                if (!name.trim()) return;
                createWorkCategory({ name: name.trim(), color });
                setName("");
              }}
            >
              카테고리 추가
            </AppButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

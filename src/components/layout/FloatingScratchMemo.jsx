import { useEffect, useRef, useState } from "react";

export default function FloatingScratchMemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || collapsed) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 150), 520)}px`;
  }, [text, collapsed]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-24 right-4 z-40 rounded-2xl border border-emerald-100 bg-emerald-50/95 px-4 py-3 text-sm font-black text-clover-deep shadow-glass backdrop-blur md:bottom-6 md:right-6"
        aria-label="임시 메모 열기"
      >
        메모잇
      </button>
    );
  }

  return (
    <aside className="fixed bottom-24 right-4 z-40 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-rose-100 bg-rose-50/95 shadow-[0_18px_55px_rgba(83,60,60,0.16)] backdrop-blur md:bottom-6 md:right-6">
      <div className="flex h-9 items-center justify-between border-b border-rose-100 bg-rose-100/75 px-3">
        <p className="text-sm font-black text-clover-text">메모잇</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="grid h-6 w-6 place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-deep"
            aria-label="메모잇 축소"
            title="축소"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setText("")}
            className="grid h-6 w-6 place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-danger"
            aria-label="메모잇 비우기"
            title="비우기"
          >
            x
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={"그냥 잠깐 끄적끄적...\n필요 없으면 x로 지워요."}
        className="block min-h-[150px] max-h-[520px] w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm leading-6 text-clover-text outline-none placeholder:text-clover-sub/70"
      />
    </aside>
  );
}

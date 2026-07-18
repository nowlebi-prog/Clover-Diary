import { useEffect, useRef, useState } from "react";

const positionKey = "clover-floating-scratch-memo-position";
const defaultPosition = { right: 28, bottom: 130 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || "null");
    if (Number.isFinite(saved?.right) && Number.isFinite(saved?.bottom)) return saved;
  } catch {
    // Ignore malformed saved positions.
  }
  return defaultPosition;
}

export default function FloatingScratchMemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState("");
  const [position, setPosition] = useState(readPosition);
  const textareaRef = useRef(null);
  const dragRef = useRef(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || collapsed) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 150), 520)}px`;
  }, [text, collapsed]);

  const startDrag = (event) => {
    if (event.target.closest("button")) return;
    const pointer = event.touches?.[0] || event;
    dragRef.current = {
      startX: pointer.clientX,
      startY: pointer.clientY,
      startRight: position.right,
      startBottom: position.bottom
    };
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("touchend", endDrag);
  };

  const moveDrag = (event) => {
    if (!dragRef.current) return;
    event.preventDefault?.();
    const pointer = event.touches?.[0] || event;
    const nextRight = dragRef.current.startRight - (pointer.clientX - dragRef.current.startX);
    const nextBottom = dragRef.current.startBottom - (pointer.clientY - dragRef.current.startY);
    const nextPosition = {
      right: clamp(nextRight, 12, Math.max(12, window.innerWidth - 96)),
      bottom: clamp(nextBottom, 76, Math.max(76, window.innerHeight - 80))
    };
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const endDrag = () => {
    if (dragRef.current) localStorage.setItem(positionKey, JSON.stringify(positionRef.current));
    dragRef.current = null;
    window.removeEventListener("mousemove", moveDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", moveDrag);
    window.removeEventListener("touchend", endDrag);
  };

  useEffect(() => () => {
    window.removeEventListener("mousemove", moveDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", moveDrag);
    window.removeEventListener("touchend", endDrag);
  }, []);

  const floatingStyle = { right: `${position.right}px`, bottom: `${position.bottom}px` };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed z-40 rounded-2xl border border-emerald-100 bg-emerald-50/95 px-4 py-3 text-sm font-black text-clover-deep shadow-glass backdrop-blur"
        style={floatingStyle}
        aria-label="임시 메모 열기"
      >
        메모잇
      </button>
    );
  }

  return (
    <aside
      className="fixed z-40 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-[10px] border border-rose-100 bg-rose-50/95 shadow-[0_18px_55px_rgba(83,60,60,0.16)] backdrop-blur"
      style={floatingStyle}
    >
      <div
        className="flex h-9 cursor-move select-none items-center justify-between border-b border-rose-100 bg-rose-100/75 px-3"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <p className="text-sm font-black text-clover-text">메모잇</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-deep"
            aria-label="메모잇 축소"
            title="축소"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setText("")}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-danger"
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

import { useEffect, useRef, useState } from "react";

const positionKey = "clover-floating-scratch-memo-position";
const defaultPosition = { right: 28, top: 120 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || "null");
    if (Number.isFinite(saved?.right) && Number.isFinite(saved?.top)) return saved;

    if (Number.isFinite(saved?.right) && Number.isFinite(saved?.bottom) && typeof window !== "undefined") {
      return {
        right: saved.right,
        top: clamp(window.innerHeight - saved.bottom - 250, 56, Math.max(56, window.innerHeight - 96))
      };
    }
  } catch {
    // Ignore malformed saved positions.
  }
  return defaultPosition;
}

export default function FloatingScratchMemo() {
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
    if (!textarea || collapsed || closed) return;

    const maxHeight = expanded ? Math.max(240, window.innerHeight - 150) : Math.max(140, window.innerHeight - position.top - 76);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, expanded ? 420 : 150), maxHeight)}px`;
  }, [text, collapsed, closed, expanded, position.top]);

  const startDrag = (event) => {
    if (expanded || event.target.closest("button")) return;

    const pointer = event.touches?.[0] || event;
    dragRef.current = {
      startX: pointer.clientX,
      startY: pointer.clientY,
      startRight: position.right,
      startTop: position.top
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
    const nextTop = dragRef.current.startTop + (pointer.clientY - dragRef.current.startY);
    const nextPosition = {
      right: clamp(nextRight, 12, Math.max(12, window.innerWidth - 96)),
      top: clamp(nextTop, 48, Math.max(48, window.innerHeight - 96))
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

  if (closed) return null;

  const floatingStyle = expanded
    ? {
        right: "24px",
        top: "72px",
        width: "min(560px, calc(100vw - 3rem))",
        maxHeight: "calc(100vh - 96px)"
      }
    : {
        right: `${position.right}px`,
        top: `${position.top}px`,
        maxHeight: `calc(100vh - ${position.top + 16}px)`
      };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed z-40 rounded-2xl border border-emerald-100 bg-emerald-50/95 px-4 py-3 text-sm font-black text-clover-deep shadow-glass backdrop-blur"
        style={floatingStyle}
        aria-label="메모잇 열기"
      >
        메모잇
      </button>
    );
  }

  return (
    <aside
      className={`fixed z-40 flex flex-col overflow-hidden rounded-[10px] border border-rose-100 bg-rose-50/95 shadow-[0_18px_55px_rgba(83,60,60,0.16)] backdrop-blur ${expanded ? "" : "w-[min(300px,calc(100vw-2rem))]"}`}
      style={floatingStyle}
    >
      <div
        className={`flex h-9 shrink-0 select-none items-center justify-between border-b border-rose-100 bg-rose-100/75 px-3 ${expanded ? "" : "cursor-move"}`}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <p className="text-sm font-black text-clover-text">메모잇</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-deep"
            aria-label={expanded ? "메모잇 원래 크기" : "메모잇 확장"}
            title={expanded ? "원래 크기" : "확장"}
          >
            {expanded ? "↙" : "↗"}
          </button>
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
            onClick={() => setClosed(true)}
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full text-sm font-black text-clover-sub hover:bg-white/70 hover:text-clover-danger"
            aria-label="메모잇 닫기"
            title="닫기"
          >
            x
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={"그냥 잠깐 끄적끄적...\n필요 없으면 x로 닫아요."}
        className="block min-h-[150px] w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm leading-6 text-clover-text outline-none placeholder:text-clover-sub/70"
      />
    </aside>
  );
}

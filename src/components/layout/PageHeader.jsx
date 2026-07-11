import { useLocation, useNavigate } from "react-router-dom";

export default function PageHeader({ eyebrow, title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== "/";

  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/75 text-lg font-black text-clover-deep shadow-sm transition hover:bg-white"
            aria-label="이전 화면으로 돌아가기"
            title="이전 화면"
          >
            ‹
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-clover-deep">{eyebrow}</p>}
          <h1 className="break-keep text-2xl font-bold text-clover-text sm:text-3xl">{title}</h1>
        </div>
      </div>
      {children}
    </header>
  );
}

import { Link } from "react-router-dom";

export default function SectionLink({ to, label = "바로가기" }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-clover-deep transition hover:bg-white"
    >
      {label} <span aria-hidden>→</span>
    </Link>
  );
}

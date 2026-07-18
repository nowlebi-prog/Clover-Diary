import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "Home", paths: ["/"] },
  { to: "/schedule", label: "Schedule", paths: ["/schedule"] },
  { to: "/life", label: "Life", paths: ["/life", "/habits", "/journal", "/mandalart"] },
  { to: "/work", label: "Work", paths: ["/work", "/tasks", "/calendar", "/daily", "/content", "/campaigns", "/files"] },
  { to: "/study", label: "Study", paths: ["/study"] },
  { to: "/money", label: "Money", paths: ["/money"] },
  { to: "/memo", label: "Memo", paths: ["/memo"] },
  { to: "/quick-links", label: "URL", paths: ["/quick-links"] },
  { to: "/archive", label: "Archive", paths: ["/archive"] }
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 overflow-x-auto rounded-full border border-white/70 bg-white/85 p-1.5 shadow-glass backdrop-blur-xl md:hidden">
      <div className="flex min-w-max gap-1">
        {items.map(({ to, label, paths }) => {
          const active = paths.some((path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)));
          return (
            <Link key={to} to={to} className={`min-w-[64px] rounded-full px-2 py-3 text-center text-[10px] font-black ${active ? "bg-clover-mint text-clover-deep" : "text-clover-sub"}`}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "HOME", paths: ["/"] },
  { to: "/plan", label: "PLAN", paths: ["/plan", "/calendar", "/daily", "/mandalart"] },
  { to: "/life", label: "LIFE", paths: ["/life", "/habits", "/journal"] },
  { to: "/work", label: "WORK", paths: ["/work", "/tasks", "/content", "/archive", "/campaigns", "/files", "/money"] }
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 rounded-full border border-white/70 bg-white/80 p-2 shadow-glass backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ to, label, paths }) => {
          const active = paths.some((path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)));
          return (
            <Link
              key={to}
              to={to}
              className={`rounded-full px-2 py-3 text-center text-xs font-bold ${active ? "bg-clover-mint text-clover-deep" : "text-clover-sub"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

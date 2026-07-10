import { Link, NavLink, useLocation } from "react-router-dom";
import CloverLogo from "../common/CloverLogo";

const items = [
  { to: "/", label: "HOME", paths: ["/"] },
  { to: "/plan", label: "PLAN", paths: ["/plan", "/calendar", "/daily", "/mandalart"] },
  { to: "/life", label: "LIFE", paths: ["/life", "/habits", "/journal"] },
  { to: "/work", label: "WORK", paths: ["/work", "/tasks", "/content", "/archive", "/campaigns", "/files", "/money"] }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-56 shrink-0 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:flex md:flex-col">
      <CloverLogo />
      <nav className="mt-8 grid gap-2.5">
        {items.map(({ to, label, paths }) => {
          const active = paths.some((path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)));
          return (
            <Link
              key={to}
              to={to}
              className={`rounded-full px-4 py-3 text-sm font-bold ${active ? "bg-clover-mint text-clover-deep" : "text-clover-sub hover:bg-white/60"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <NavLink
        to="/settings"
        aria-label="Settings"
        title="Settings"
        className={({ isActive }) => `mt-auto flex h-11 w-11 items-center justify-center rounded-full text-lg ${isActive ? "bg-clover-mint text-clover-deep" : "bg-white/45 text-clover-sub hover:bg-white/70"}`}
      >
        <span aria-hidden="true">⚙</span>
      </NavLink>
    </aside>
  );
}

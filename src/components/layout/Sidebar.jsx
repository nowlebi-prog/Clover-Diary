import { Link, NavLink, useLocation } from "react-router-dom";
import CloverLogo from "../common/CloverLogo";
import { logout } from "../../lib/auth/localAuthAdapter";

const items = [
  { to: "/", label: "Home", paths: ["/"] },
  { to: "/life", label: "Life", paths: ["/life", "/habits", "/journal", "/mandalart"] },
  { to: "/work", label: "Work", paths: ["/work", "/tasks", "/calendar", "/daily", "/content", "/campaigns", "/files"] },
  { to: "/money", label: "Money", paths: ["/money"] },
  { to: "/archive", label: "Archive", paths: ["/archive"] }
];

export default function Sidebar() {
  const location = useLocation();
  const signOut = () => {
    sessionStorage.removeItem("clover-money-unlocked");
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-56 shrink-0 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:flex md:flex-col">
      <CloverLogo />
      <nav className="mt-8 grid gap-2.5">
        {items.map(({ to, label, paths }) => {
          const active = paths.some((path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)));
          return (
            <Link key={to} to={to} className={`rounded-full px-4 py-3 text-sm font-bold ${active ? "bg-clover-mint text-clover-deep" : "text-clover-sub hover:bg-white/60"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-2">
        <NavLink
          to="/settings"
          aria-label="Settings"
          title="Settings"
          className={({ isActive }) => `flex h-11 w-11 items-center justify-center rounded-full text-lg ${isActive ? "bg-clover-mint text-clover-deep" : "bg-white/45 text-clover-sub hover:bg-white/70"}`}
        >
          <span aria-hidden="true">⚙</span>
        </NavLink>
        <button type="button" onClick={signOut} className="rounded-full bg-white/55 px-4 py-3 text-left text-sm font-bold text-clover-sub hover:bg-white/80">
          로그아웃
        </button>
      </div>
    </aside>
  );
}

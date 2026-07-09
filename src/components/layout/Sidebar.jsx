import { NavLink } from "react-router-dom";
import CloverLogo from "../common/CloverLogo";

const items = [
  ["/", "Home"], ["/calendar", "Calendar"], ["/tasks", "Tasks"], ["/daily", "Daily"], ["/habits", "Habits"], ["/life", "Life"],
  ["/money", "Money"], ["/content", "Content"], ["/campaigns", "Campaigns"], ["/files", "Files"], ["/archive", "Archive"], ["/settings", "Settings"]
];

export default function Sidebar() {
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-64 shrink-0 rounded-[28px] border border-white/70 bg-white/45 p-4 backdrop-blur-xl md:block">
      <CloverLogo />
      <nav className="mt-8 grid gap-2">
        {items.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `rounded-full px-4 py-3 text-sm font-bold ${isActive ? "bg-clover-mint text-clover-deep" : "text-clover-sub hover:bg-white/60"}`}>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

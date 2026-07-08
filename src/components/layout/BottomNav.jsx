import { NavLink } from "react-router-dom";

const items = [["/", "Home"], ["/calendar", "Calendar"], ["/daily", "Daily"], ["/tasks", "Tasks"], ["/settings", "More"]];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-3 left-3 right-3 z-30 rounded-full border border-white/70 bg-white/80 p-2 shadow-glass backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `rounded-full px-2 py-3 text-center text-xs font-bold ${isActive ? "bg-clover-mint text-clover-deep" : "text-clover-sub"}`}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
